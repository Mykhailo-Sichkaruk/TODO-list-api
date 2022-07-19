import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getTokenId, verifyToken } from "./Auth";
import { body, validationResult } from "express-validator";

const prisma = new PrismaClient();

export const List = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cl5sa8bo30002m0ta5a59y1zc"
 *         title:
 *           type: string
 *           example: "Task"
 *         body:
 *           type: string
 *           example: "Do something"
 *         deadline:
 *           type: date
 *           example: "2020-01-01:00:00:00"
 *         authorId:
 *           type: string
 *           example: "cl5peyfcp00025wtajaia1jcc"
 *         listId:
 *           type: string
 *           example: "cl5sa8bo30002m0ta5a59y1zc"
 *         status:
 *           type: string
 *           example: "ACTIVE"
 *     # Create 
 *     ListCreateRequest: # Req
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           example: "TODO"
 *     ListCreateResponse: # Res
 *       type: object
 *       required:
 *         - success
 *         - message        
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: object
 *           required:
 *             - title
 *             - id
 *           properties:
 *             title:
 *               type: string
 *               example: "TODO"
 *             id:
 *               type: string
 *               example: "cl5sa8bo30002m0ta5a59y1zc" 
 *     # Delete
 *     ListDeleteRequest: # Req
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           example: "cl5sa8bo30002m0ta5a59y1zc"
 *     ListDeleteResponse: # Res
 *       type: object
 *       required:
 *         - id
 *         - title
 *       properties:
 *         id:
 *           type: string
 *           example: "cl5sa8bo30002m0ta5a59y1zc"
 *         title:
 *           type: string
 *           example: "TODO"
 *     # Update
 *     ListUpdateRequest: # Req
 *       type: object
 *       required:
 *         - id
 *         - title
 *       properties:
 *         id:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           example: "cl5sa8bo30002m0ta5a59y1zc"
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           example: "TODO"
 *     # Get 
 *     ListGetResponse: # Res
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           id:
 *             type: string
 *             example: "cl5sa8bo30002m0ta5a59y1zc"
 *           title:
 *             type: string
 *             example: "List"
 *           tasks:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Task'
 *     # Subscribe
 *     ListSubscribeRequest:
 *       type: object
 *       required:
 *         - userId
 *         - listId
 *       properties:
 *         userId:
 *           type: string
 *           example: "cl5peyfcp00025wtajaia1jcc"
 *         listId:
 *           type: string
 *           example: "cl5sa8bo30002m0ta5a59y1zc"
 *     # Errors
 *     ErrorInvalidInput:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Invalid input"
 *         errors:
 *           type: array
 */

/**
 * @swagger
 * /list:
 *   post:
 *     tags:
 *       - List
 *     security:
 *       - bearerAuth: []
 *     description: Create list
 *     summary: Create list
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListCreateRequest'
 *     responses:
 *       200:
 *         description: List created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListCreateResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorInvalidInput'
 *       401:
 *         description: Unauthorized
 *       444:
 *         description: JSON parse error
*/
List.post("/",
	body("title").exists().isLength({ min: 1 }).withMessage("Title must be at least 1 characters long"),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ success: "false", message: "Invalid input", errors: errors.array() });
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token))
			res.status(401).json({ success: "false", message: "Unauthorized" });
		// Create List
		const { title } = req.body;
		const list = await prisma.list.create({ data: { title, subscribers: { connect: { id: getTokenId(token) } } } });
		res.status(200).json({ success: "true", message: list });
	});

/**
 * @swagger
 * /list:
 *   delete:
 *     tags:
 *       - List
 *     security:
 *       - bearerAuth: []
 *     description: Delete list
 *     summary: Delete list
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListDeleteRequest'
 *     responses:
 *       200:
 *         description: List deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListDeleteResponse'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List not found
 */
List.delete("/",
	body("id").exists().isLength({ min: 1 }).withMessage("Id must be at least 1 characters long"),
	async (req, res) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ success: "false", message: "Invalid input", errors: errors.array() });
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token))
			return res.status(401).json({ success: "false", message: "Unauthorized" });
		// Check if list exists
		const { id } = req.body;
		const list = await prisma.list.findUnique({ where: { id } });
		if (!list)
			return res.status(404).json({ success: "false", message: "List does not exist" });
		// Delete list
		await prisma.list.delete({ where: { id } });
		res.status(200).json({ success: "true", message: list });
	});

/**
 * @swagger
 * /list:
 *   put:
 *     tags:
 *       - List
 *     security:
 *       - bearerAuth: []
 *     description: Update list's title
 *     summary: Update list's title
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListUpdateRequest'
 *     responses:
 *       200:
 *         description: Lists returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListUpdateRequest'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List does not exist
 *       406:
 *         description: List does not belong to this user
 *       444:
 *         description: JSON parse error
 */
List.put("/",
	body("id").exists().isString().isLength({ min: 1 }).withMessage("Id must be at least 1 characters long"),
	body("title").exists().isString().isLength({ min: 1 }).withMessage("Name must be at least 1 characters long"),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ success: "false", messaga: "Incorrect input", errors: errors.array() });
		// CHeck if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token))
			return res.status(400).json({ success: "false", message: "Unauthorized" });
		// Check if list exists
		const { id, title } = req.body;
		let list = await prisma.list.findUnique({ where: { id } });
		if (!list)
			return res.status(404).json({ success: "false", message: "List not found" });
		// Check if request sender is a member of the list
		const author =  await prisma.list.findFirst({ where: { id, subscribers: { some: { id: getTokenId(token) } } } });
		if (!author)
			return res.status(406).json({ success: "false", message: `You are not member of ${list.title}(${list.id}). \nPlease ask author of this Todo-list to add you` });
		// Update list title
		list = await prisma.list.update({ where: { id }, data: { title } });
		res.status(200).json({ success: "true", message: list });
	});

/**
 * @swagger
 * /list:
 *   get:
 *     tags:
 *       - List
 *     security:
 *       - bearerAuth: []
 *     description: Get all lists
 *     summary: Get all lists
 *     responses:
 *       200:
 *         description: Lists returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListGetResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List does not exist 
 *       444:
 *         description: JSON parse error           
 */
List.get("/", async (req: express.Request, res: express.Response) => {
	// Check if user is authorized
	const token = req.headers.authorization?.split(" ")[ 1 ] || "";
	if (!verifyToken(token))
		return res.status(401).json({ success: "false", message: "Unauthorized" });
	// Send all lists with tasks
	const lists = await prisma.list.findMany({
		where: { subscribers: { some: { id: getTokenId(token) } } },
		include: { items: true },
	});
	// Check if user has any lists
	if (!lists)
		return res.status(404).json({ success: "false", message: "No lists found" });
	// Send lists
	res.status(200).json({ success: "true", message: lists });
});


/**
 * @swagger
 * /list/{id}:
 *   get:
 *     tags:
 *       - List
 *     security:
 *       - bearerAuth: []
 *     description: Get list by id
 *     summary: Get list by id
 *     parameters:
 *       - in: path
 *         name: id
 *         description: String ID of the list to get
 *         required: true
 *     responses:
 *       200:
 *         description: List returned
 */
List.get("/:id", async (req: express.Request, res: express.Response) => {
	// Check if user is authorized
	const token = req.headers.authorization?.split(" ")[ 1 ] || "";
	if (!verifyToken(token))
		return res.status(401).json({ success: "false", message: "Unauthorized" });
	// Check if list exists
	const { id } = req.params;
	const list = await prisma.list.findUnique({ where: { id }, include: { items: true } });
	// Check if list exists
	if (!list)
		return res.status(404).json({ success: "false", message: "List not found" });
	// Send list 
	res.status(200).json({ success: "true", message: list });
});

/**
 * @swagger
 * /list/subscribe:
 *   post:
 *     tags:
 *       - List
 *     security:
 *       - bearerAuth: []
 *     description: Subscribe user to list
 *     summary: Subscribe user to list
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListSubscribeRequest'
 *     responses:
 *       200:
 *         description: List created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List does not exist
 *       406:
 *         description: List does not belong to this user
 *       444:
 *         description: JSON parse error
 */
List.post("/subscribe",
	body("userId").exists({ checkFalsy: true }).isString().isLength({ min: 1 }).withMessage("Id must be at least 1 characters long"),
	body("listId").exists({ checkFalsy: true }).isString().isLength({ min: 1 }).withMessage("Id must be at least 1 characters long"),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ success: "false", messaga: "Incorrect input", errors: errors.array() });
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token))
			return res.status(401).json({ success: "false", message: "Unauthorized" });
		// Check if list exists
		const { listId, userId } = req.body;
		const listSubscribe = await prisma.list.findUnique({ where: { id: listId } });
		if (!listSubscribe)
			return res.status(400).json({ success: "false", message: "List not found" });
		// Check if request sender is a member of the list
		const author =  await prisma.list.findFirst({ where: { id: listId, subscribers: { some: { id: getTokenId(token) } } } });
		if (!author)
			return res.status(400).json({ success: "false", message: `You are not member of ${listSubscribe.title}. \nPlease ask author of this Todo-list to add you` });
		// Check if new member exists
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user)
			return res.status(400).json({ success: "false", message: "User not found" });
		// Add new member to list
		const list = await prisma.list.update({ where: { id: listId }, data: { subscribers: { connect: { id: userId } } } });
		res.status(200).json({ success: "true", message: list });
	}
);
