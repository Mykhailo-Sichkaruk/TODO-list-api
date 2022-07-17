import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getTokenId, verifyToken  } from "./Auth";
import { body, Meta, validationResult } from "express-validator";

const prisma = new PrismaClient();
export const Task = Router();

Task.post("/",
	body("title").isString().isLength({ min: 1 }).withMessage("Title must be at least 1 characters long"),
	body("body").isString().isLength({ min: 1 }).withMessage("Body must be at least 1 characters long"),
	body("listId").notEmpty().withMessage("ListId must be provided"),
	body("status").isIn(["ACTIVE", "DONE", "CLOSED", "IN_PROGRESS", undefined]).withMessage("Status must be in : [ACTIVE, DONE, CLOSED, IN_PROGRESS]"),
	body("deadline").customSanitizer(checkDeadline).exists().withMessage("Deadline must be a valid date or empty"),
	async (req: express.Request, res: express.Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ success: "false", message: "Invalid input", errors: errors.array() });
			return;
		}

		const { title, body, listId, status, deadline } = req.body;
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		const authorId = getTokenId(token);
		const list = await prisma.list.findUnique({ where: { id: listId } });

		if (!verifyToken(token)) {
			res.status(401).json({ success: "false", message: "Unauthorized" });
			return;
		}

		if (!list) {
			res.status(404).json({ success: "false", message: "List not found" });
			return;
		}

		const user =  await prisma.list.findFirst({ where: { id: listId, subscribers: { some: { id: authorId } } } });

		if (!user) {
			res.status(404).json({ success: "false", message: `You are not member of ${list.title}. \nPlease ask author of this Todo-list to add you` });
			return;
		}

		const task = await prisma.task.create({ data: { title, body, listId, deadline, status, authorId } });
		await prisma.list.update({ where: { id: listId }, data: { items: { connect: { id: task.id } } } });
		res.status(200).json({ success: "true", message: task });
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
