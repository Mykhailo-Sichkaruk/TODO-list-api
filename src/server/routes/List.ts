import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getTokenId, verifyToken } from "./Auth";
import { body, validationResult } from "express-validator";

const prisma = new PrismaClient();

export const List = Router();

/**
 * @api {post} /list Create a new list
 * @apiName CreateList
 * @apiGroup List
 * @apiVersion 1.0.0
 * @apiDescription Create a new list
 * @apiHeader {String} Authorization Bearer + token
 * @apiHeaderExample {json} Header-Example: Bearer + eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsNXBleWZjcDAwMDI1d3RhamFpYTFqY2MiLCJpYXQiOjE2NTgwNjgxMzIsImV4cCI6MTY1ODA3MTczMn0.5EPU0LzjBdK5gm3lp_f49C-yM5vu4eWHDALLXHCk7sg
 * @apiParam {String} title Title of the list
 * @apibody {String} body Body of the list 
*/
List.post("/",
	body("title").exists().isLength({ min: 1 }).withMessage("Title must be at least 1 characters long"),
	async (req, res) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ success: "false", message: "Invalid input", errors: errors.array() });
			return;
		}
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token)) {
			res.status(400).json({ success: "false", message: "Unauthorized" });
			return;
		}
		// Create List
		const { title } = req.body;
		const list = await prisma.list.create({ data: { title, subscribers: { connect: { id: getTokenId(token) } } } });
		console.log("list: ", list);
		res.status(200).json({ success: "true", message: list });
	});

/**
 * @api {delete} api/v1/list/ Subscribe to list
 * @apiName DeleteList
 * @apiGroup List
 * @apiVersion 1.0.0
 * @apiDescription Delete a list
 * @apiHeader {String} Authorization Bearer + token
 * @apiHeaderExample {json} Header-Example: Bearer + eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsNXBleWZjcDAwMDI1d3RhamFpYTFqY2MiLCJpYXQiOjE2NTgwNjgxMzIsImV4cCI6MTY1ODA3MTczMn0.5EPU0LzjBdK5gm3lp_f49C-yM5vu4eWHDALLXHCk7sg
 * @apiParam {String} id ID of the list
 */
List.delete("/",
	body("id").isLength({ min: 1 }).withMessage("Id must be at least 1 characters long"),
	async (req, res) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ success: "false", message: "Invalid input", errors: errors.array() });
			return;
		}
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token)) {
			res.status(400).json({ success: "false", message: "Unauthorized" });
			return;
		}
		// Check if list exists
		const { id } = req.body;
		const list = await prisma.list.findUnique({ where: { id } });
		if (!list) {
			res.status(400).json({ success: "false", message: "List does not exist" });
			return;
		}
		// Delete List
		await prisma.list.delete({ where: { id } });
		res.status(200).json({ success: "true", message: list });
	});

/**
 * @api {put} api/v1/list/ Update all lists
 * @apiName UpdateList
 * @apiGroup List
 * 
 */
List.put("/",
	body("id").exists().isString().isLength({ min: 1 }).withMessage("Id must be at least 1 characters long"),
	body("name").exists().isString().isLength({ min: 1 }).withMessage("Name must be at least 1 characters long"),
	async (req, res) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: "false", messaga: "Incorrect input", errors: errors.array() });
		}
		// CHeck if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token)) {
			res.status(400).json({ success: "false", message: "Unauthorized" });
			return;
		}
		// Update list title
		const { id, title } = req.body;
		const list = await prisma.list.update({ where: { id }, data: { title } });
		res.status(200).json({ success: "true", message: list });
	});

/**
 * @api {get} api/v1/list/ Get all lists
 * @apiName GetAllLists
 * @apiGroup List
 */
List.get("/", async (req, res) => {
	// Check if user is authorized
	const token = req.headers.authorization?.split(" ")[ 1 ] || "";
	if (!verifyToken(token)) {
		res.status(400).json({ success: "false", message: "Unauthorized" });
		return;
	}
	// Send all lists with tasks
	const lists = await prisma.list.findMany({
		where: { subscribers: { some: { id: getTokenId(token) } } },
		include: { items: true },
	});
	res.status(200).json({ success: "true", message: lists });
});

/**
 * @api {get} api/v1/list/subscribe Subscribe user to List
 * @apiName SubscribeToList
 * @apiGroup List
 * @apiVersion 1.0.0
 * @apiDescription Subscribe user to list
 * @apiHeader {String} Authorization Bearer + token
 * @apiHeaderExample {json} Header-Example: Bearer + eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsNXBleWZjcDAwMDI1d3RhamFpYTFqY2MiLCJpYXQiOjE2NTgwNjgxMzIsImV4cCI6MTY1ODA3MTczMn0.5EPU0LzjBdK5gm3lp_f49C-yM5vu4eWHDALLXHCk7sg
 * @apiParam {String} id of the list
 * @apiParam {String} id of user to subscribe
 * @apiSuccess {String} {success: true, message: list}
 */
List.post("/subscribe",
	body("userId").exists().isString().isLength({ min: 1 }).withMessage("Id must be at least 1 characters long"),
	body("listId").exists().isString().isLength({ min: 1 }).withMessage("Id must be at least 1 characters long"),
	async (req, res) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: "false", messaga: "Incorrect input", errors: errors.array() });
		}
		// Check if user is authorized
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (!verifyToken(token)) {
			res.status(400).json({ success: "false", message: "Unauthorized" });
			return;
		}
		// Check if list exists
		const { listId, userId } = req.body;
		const listSubscribe = await prisma.list.findUnique({ where: { id: listId } });
		if (!listSubscribe) {
			res.status(400).json({ success: "false", message: "List not found" });
			return;
		}
		// Check if request sender is a member of the list
		const author =  await prisma.list.findFirst({ where: { id: listId, subscribers: { some: { id: getTokenId(token) } } } });
		if (!author) {
			res.status(400).json({ success: "false", message: `You are not member of ${listSubscribe.title}. \nPlease ask author of this Todo-list to add you` });
			return;
		}
		// Check if new member exists
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			res.status(400).json({ success: "false", message: "User not found" });
			return;
		}
		// Add new member to list
		const list = await prisma.list.update({ where: { id: listId }, data: { subscribers: { connect: { id: userId } } } });
		res.status(200).json({ success: "true", message: list });
	}
);
