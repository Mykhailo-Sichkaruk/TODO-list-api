import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getTokenId, verifyToken } from "./Auth";
import { body, validationResult } from "express-validator";
import { ERROR, LIST, MSG } from "../../constants";

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
 *           example: "2023-01-01:00:00:00"
 *         authorId:
 *           type: string
 *           example: "cl5peyfcp00025wtajaia1jcc"
 *         listId:
 *           type: string
 *           example: "cl5sa8bo30002m0ta5a59y1zc"
 *         status:
 *           type: string
 *           example: "ACTIVE"
 *     List:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cl5sa8bo30002m0ta5a59y1zc"
 *         title:
 *           type: string
 *           example: "List"
 *         tasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Task'
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
 *           value: true
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
 *         $ref: '#/components/schemas/List'
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
 *     Error444JSONparse:  
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "JSON Parse Error"
 *         error:
 *           type: string
 *           example: "Unexpected token : in JSON at position 26"
 *     Error401Unauthorized:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Unauthorized. Please register or login and add response token to header."
 *     Error404InvalidInput:
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
 *           items:
 *             type: object
 *             properties:
 *               example:
 *                 type: string
 *                 example: "N"
 *               msg: 
 *                 type: string
 *                 example: "Title must be at least 3 characters"
 *               param:
 *                 type: string
 *                 expample: "title"
 *               location:
 *                 type: string
 *                 example: "body"
 *   responses:
 *     Unauthorized:
 *       description: Unauthorized
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error401Unauthorized'
 *     InvalidInput:
 *       description: Invalid input
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error404InvalidInput'
 *     JSONParseError:
 *       description: JSON Parse Error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error444JSONparse'
 *        
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
 *         $ref: '#/components/responses/InvalidInput'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       444:
 *         $ref: '#/components/responses/JSONParseError'
*/
List.post("/",
	body("title").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString).isLength(LIST.TITLE).withMessage(LIST.TITLE.message),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json(ERROR[ 400 ](errors.array()));
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token))
			return res.status(401).json(ERROR[ 401 ]);
		// Create List
		const { title } = req.body;
		const authorId = getTokenId(token);
		const list = await prisma.list.create({ data: { title, authorId, subscribers: { connect: { id: authorId } } } });
		res.status(200).json({ success: true, message: list });
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
 *         $ref: '#/components/responses/InvalidInput'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: List not found
 *       444:
 *         $ref: '#/components/responses/JSONParseError'
 */
List.delete("/",
	body("id").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString),
	async (req, res) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json(ERROR[ 400 ](errors.array()));
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token))
			return res.status(401).json(ERROR[ 401 ]);
		// Check if list exists
		const { id } = req.body;
		const list = await prisma.list.findUnique({ where: { id } });
		if (!list)
			return res.status(404).json({ success: false, message: "List not found" });
		// Check if user is member of list
		const author =  await prisma.list.findFirst({ where: { id, subscribers: { some: { id: getTokenId(token) } } } });
		if (!author)
			return res.status(406).json(ERROR[ 406 ].LIST(list));
		// Delete list
		await prisma.list.delete({ where: { id } });
		res.status(200).json({ success: true, message: list });
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
 *         $ref: '#/components/responses/JSONParseError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: List does not exist
 *       406:
 *         description: List does not belong to this user
 *       444:
 *         $ref: '#/components/responses/JSONParseError'
 */
List.put("/",
	body("id").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString),
	body("title").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString).isLength(LIST.TITLE).withMessage(LIST.TITLE.message),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).type("json").json(ERROR[ 400 ](errors.array()));
		// CHeck if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token))
			return res.status(401).json(ERROR[ 401 ]);
		// Check if list exists
		const { id, title } = req.body;
		let list = await prisma.list.findUnique({ where: { id } });
		if (!list)
			return res.status(404).json({ success: false, message: "List not found" });
		// Check if request sender is a member of the list
		const author =  await prisma.list.findFirst({ where: { id, subscribers: { some: { id: getTokenId(token) } } } });
		if (!author)
			return res.status(406).json({ success: false, message: `You are not member of ${list.title}(${list.id}). \nPlease ask author of this Todo-list to add you` });
		// Update list title
		list = await prisma.list.update({ where: { id }, data: { title } });
		res.status(200).json({ success: true, message: list });
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
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: List does not exist 
 *       444:
 *         $ref: '#/components/responses/JSONParseError' 
*/
List.get("/", async (req: express.Request, res: express.Response) => {
	// Check if user is authorized
	const token = req.headers.authorization?.split(" ")[ 1 ] || "";
	if (!verifyToken(token))
		return res.status(401).json(ERROR[ 401 ]);
	// Send all lists with tasks
	const lists = await prisma.list.findMany({
		where: { subscribers: { some: { id: getTokenId(token) } } },
		include: { tasks: true },
	});
	// Check if user has any lists
	if (!lists)
		return res.status(404).json({ success: false, message: "No lists found" });
	// Send lists
	res.status(200).json({ success: true, message: lists });
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
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/List'
 *       404:
 *         description: List does not exist. Please check list`s id
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
List.get("/:id", async (req: express.Request, res: express.Response) => {
	// Check if user is authorized
	const token = req.headers.authorization?.split(" ")[ 1 ] || "";
	if (!verifyToken(token))
		return res.status(401).json(ERROR[ 401 ]);
	// Check if list exists
	const { id } = req.params;
	const list = await prisma.list.findUnique({ where: { id }, include: { tasks: true } });
	// Check if list exists
	if (!list)
		return res.status(404).json({ success: false, message: "List not found" });
	// Send list 
	res.status(200).json({ success: true, message: list });
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
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: List does not exist
 *       406:
 *         description: List does not belong to this user
 *       444:
 *         description: JSON parse error
 */
List.post("/subscribe",
	body("userId").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString),
	body("listId").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json(ERROR[ 400 ](errors.array()));
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token))
			return res.status(401).json(ERROR[ 401 ]);
		// Check if list exists
		const { listId, userId } = req.body;
		const listSubscribe = await prisma.list.findUnique({ where: { id: listId } });
		if (!listSubscribe)
			return res.status(404).json({ success: false, message: "List not found" });
		// Check if request sender is a member of the list
		const author =  await prisma.list.findFirst({ where: { id: listId, subscribers: { some: { id: getTokenId(token) } } } });
		if (!author)
			return res.status(406).json({ success: false, message: `You are not member of ${listSubscribe.title}. \nPlease ask author of this Todo-list to add you` });
		// Check if new member exists
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user)
			return res.status(404).json({ success: false, message: "User not found" });
		// Check if user is already member of the list
		const member = await prisma.list.findFirst({ where: { id: listId, subscribers: { some: { id: userId } } } });
		if (member)
			return res.status(406).json({ success: false, message: "User is already member of this list" });
			// Subscribe user to list
		const list = await prisma.list.update({ where: { id: listId }, data: { subscribers: { connect: { id: userId } } } });
		res.status(200).json({ success: true, message: list });
	}
);
