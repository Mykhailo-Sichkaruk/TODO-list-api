import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getTokenId, verifyToken  } from "./Auth";
import { body, Meta, validationResult } from "express-validator";

const prisma = new PrismaClient();
export const Task = Router();

/**
 * @api {post} /task Create a new task
 * @apiName CreateTask
 * @apiGroup Task
 * @apiVersion 1.0.0
 * @apiDescription Create a new task
 * @apiHeader {String} Authorization Bearer + token
 * @apiHeaderExample {json} Header-Example: Bearer + eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsNXBleWZjcDAwMDI1d3RhamFpYTFqY2MiLCJpYXQiOjE2NTgwNjgxMzIsImV4cCI6MTY1ODA3MTczMn0.5EPU0LzjBdK5gm3lp_f49C-yM5vu4eWHDALLXHCk7sg
 * @apiParam {String} title: Title of the task
 * @apiParam {String} body: Description of the task
 * @apiParam {String || number || DateTime} deadline: Deadline of the task
 * @apiParam {String} listId: ID of the list the task belongs to
 * @apiParam {String} status: Status of the task [ACTIVE, DONE, CLOSED, IN_PROGRESS]
 * @apeResposnse {json} Request-Example: {cuccess: true/false, message: task}
 */
Task.post("/",
	body("title").isString().isLength({ min: 1 }).withMessage("Title must be at least 1 characters long"),
	body("body").isString().isLength({ min: 1 }).withMessage("Body must be at least 1 characters long"),
	body("listId").notEmpty().withMessage("ListId must be provided"),
	body("status").isIn(["ACTIVE", "DONE", "CLOSED", "IN_PROGRESS", undefined]).withMessage("Status must be in : [ACTIVE, DONE, CLOSED, IN_PROGRESS]"),
	body("deadline").customSanitizer(checkDeadline).exists().withMessage("Deadline must be a valid date or empty"),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ success: "false", message: "Invalid input", errors: errors.array() });
			return;
		}
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token)) {
			res.status(401).json({ success: "false", message: "Unauthorized" });
			return;
		}
		const { title, body, listId, status, deadline } = req.body;
		const authorId = getTokenId(token);
		// Check if list exists
		const list = await prisma.list.findUnique({ where: { id: listId } });
		if (!list) {
			res.status(404).json({ success: "false", message: "List not found" });
			return;
		}
		// Check if user is member of list
		const user =  await prisma.list.findFirst({ where: { id: listId, subscribers: { some: { id: authorId } } } });
		if (!user) {
			res.status(404).json({ success: "false", message: `You are not member of ${list.title}. \nPlease ask author of this Todo-list to add you` });
			return;
		}
		// Create task
		const task = await prisma.task.create({ data: { title, body, listId, deadline, status, authorId } });
		await prisma.list.update({ where: { id: listId }, data: { items: { connect: { id: task.id } } } });
		res.status(200).json({ success: "true", message: task });
	});

/**
 * @api {delete} /task/ Delete a task
 * @apiName DeleteTask
 * @apiGroup Task
 * @apiVersion 1.0.0
 * @apiDescription Delete a task
 * @apiHeader {String} Authorization Bearer + token
 * @apiHeaderExample {json} Header-Example: Bearer + eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsNXBleWZjcDAwMDI1d3RhamFpYTFqY2MiLCJpYXQiOjE2NTgwNjgxMzIsImV4cCI6MTY1ODA3MTczMn0.5EPU0LzjBdK5gm3lp_f49C-yM5vu4eWHDALLXHCk7sg
 * @apiParam {String} taskId: ID of the task
 */
Task.delete("/",
	body("id").notEmpty().withMessage("id of task must be provided"),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ success: "false", message: "Invalid input", errors: errors.array() });
			return;
		}
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token)) {
			res.status(401).json({ success: "false", message: "Unauthorized" });
			return;
		}
		const { id } = req.body;
		// Check if task exists
		const task = await prisma.task.findUnique({ where: { id } });
		if (!task) {
			res.status(404).json({ success: "false", message: "Task not found" });
			return;
		}
		// Check if user is author of task
		if (task.authorId !== getTokenId(token)) {
			res.status(403).json({ success: "false", message: "You are not author of this task" });
			return;
		}
		// Delete task
		await prisma.task.delete({ where: { id } });
		res.status(200).json({ success: "true", message: "Task deleted" });
	});


function checkDeadline(value: string | number | Date, { req }: Meta) {
	if (!value) {
		return new Date(Date.now() + (1000 * 60 * 60 * 24));
	} else if (value instanceof Date) {
		return req.body.deadline;
	} else {
		const date = new Date(value);
		if (date.getTime() > Date.now()) {
			return date;
		}
	}
	return undefined;
}
