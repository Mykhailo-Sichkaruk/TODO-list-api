import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getTokenId, verifyToken } from "./Auth";
import { body, Meta, validationResult } from "express-validator";
import { ERROR, MSG, TASK } from "../../constants";

const prisma = new PrismaClient();
export const Task = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     # Create
 *     TaskCreateRequest: # Req
 *       type: object
 *       required:
 *         - title
 *         - body
 *         - listId
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           example: "Task 1"
 *         body:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *           example: "Task 1 body"
 *         listId:
 *           type: string
 *           example: "cl5pf2wpf000004tal8ai4dus"
 *         deadline:
 *           type: Date
 *           example: "2023-01-01T00:00:00.000Z"
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - IN_PROGRESS
 *             - DONE
 *             - CLOSED
 *           example: "ACTIVE"
 *     # Delete
 *     TaskDeleteRequest: # Req
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           example: "cl5pf2wpf000004tal8ai4dus"
 *     # Update
 *     TaskUpdateRequest: # Req
 *       type: object
 *       required:
 *         - id
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           example: "cl5pf2wpf000004tal8ai4dus"
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - IN_PROGRESS
 *             - DONE
 *             - CLOSED
 */

/**
 * @swagger
 * /task:
 *   post:
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     summary: Create new task
 *     description: Create new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskCreateRequest'
 *     responses:
 *       200:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: List not found
 *       406:
 *         description: You are not member of this list
 *       444:
 *         description: JSON parse error
 */
Task.post("/",
	body("listId").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString),
	body("title").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString).isLength(TASK.TITLE).withMessage(TASK.TITLE.message),
	body("body").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString).isLength(TASK.BODY).withMessage(TASK.BODY.message),
	body("status").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString).isIn(TASK.STATUS.values).withMessage(TASK.STATUS.message),
	body("deadline").customSanitizer(checkDeadline).exists().withMessage("Deadline must be a valid date or empty"),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json(ERROR[ 400 ](errors.array()));
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token))
			return res.status(401).json({ success: false, message: ERROR[ 401 ].message });
		const { title, body, listId, status, deadline } = req.body;
		const authorId = getTokenId(token);
		// Check if list exists
		const list = await prisma.list.findUnique({ where: { id: listId } });
		if (!list)
			return res.status(404).json({ success: false, message: "List not found" });
		// Check if user is member of list
		const user = await prisma.list.findFirst({ where: { id: listId, subscribers: { some: { id: authorId } } } });
		if (!user)
			return res.status(406).json({ success: false, message: `You are not member of ${list.title}. \nPlease ask author of this Todo-list to add you` });
		// Create task
		const task = await prisma.task.create({ data: { title, body, listId, deadline, status, authorId } });
		await prisma.list.update({ where: { id: listId }, data: { tasks: { connect: { id: task.id } } } });
		res.status(200).json({ success: true, message: task });
	});

/**
 * @swagger
 * /task:
 *   delete:
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     summary: Delete task
 *     description: Delete task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskDeleteRequest'
 *     responses:
 *       200:
 *         description: Task deleted
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Task not found
 *       406:
 *         description: You are not author of this task
 *       444:
 *         description: JSON parse error
*/
Task.delete("/",
	body("id").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json(ERROR[ 400 ](errors.array()));
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token))
			return res.status(401).json(ERROR[ 401 ]);
		const { id } = req.body;
		// Check if task exists
		const task = await prisma.task.findUnique({ where: { id } });
		if (!task)
			return res.status(404).json({ success: false, message: "Task not found" });
		// Check if user is author of task
		if (task.authorId !== getTokenId(token))
			return res.status(403).json({ success: false, message: "You are not author of this task" });
		// Delete task
		await prisma.task.delete({ where: { id } });
		res.status(200).json({ success: true, message: "Task deleted" });
	});

/**
 * @swagger
 * /task:
 *   put:
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     summary: Update task
 *     description: Update task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskUpdateRequest'
 *     responses:
 *       200: 
 *         description: Task updated
 *       400:
 *         $ref: '#/components/responses/InvalidInput'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Task not found
 *       406:
 *         description: You are not author of this task
 *       444:
 *         $ref: '#/components/responses/JSONParseError'
 */
Task.put("/",
	body("id").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString),
	body("status").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString).isIn(TASK.STATUS.values).withMessage(TASK.STATUS.message),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json(ERROR[ 400 ](errors.array()));
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token))
			return res.status(401).json(ERROR[ 401 ]);
		const { id, status } = req.body;
		// Check if task exists
		const task = await prisma.task.findUnique({ where: { id } });
		if (!task)
			return res.status(404).json({ success: false, message: "Task not found" });
		// Check if user is member of list
		const user = await prisma.list.findFirst({ where: { id: task.listId, subscribers: { some: { id: getTokenId(token) } } } });
		if (!user)
			return res.status(403).json({ success: false, message: `You are not member of ${task.id}. \nPlease ask author of this Todo-list to add you` });
		// Update task
		await prisma.task.update({ where: { id }, data: { status } });
		res.status(200).json({ success: true, message: "Task updated" });
	});

function checkDeadline(value: string | number | Date, { req }: Meta) {
	if (!value) {
		const day = 1000 * 60 * 60 * 24; // 1000 ms * 60 s * 60 min * 24 h
		return new Date(Date.now() + day); // 1 day from now
	} else if (value instanceof Date) {
		return req.body.deadline;
	}
	const date = new Date(value);
	if (date.getTime() > Date.now()) {
		return date;
	}

	return undefined;
}
