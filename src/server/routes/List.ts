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
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ success: "false", message: "Invalid input", errors: errors.array() });
			return;
		}

		const { title } = req.body;
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";

		if (await verifyToken(token)) {
			const list = await prisma.list.create({ data: { title, subscribers: { connect: { id: getTokenId(token) } } } });
			console.log("list: ", list);
			res.status(200).json({ success: "true", message: list });
		} else {
			res.status(401).json({ success: "false", message: "Unauthorized" });
		}
	});

/**
 * @api {delete} api/v1/list/ Subscribe to list
 * @apiName DeleteList
 */
List.delete("/",
	body("id").isLength({ min: 1 }).withMessage("Id must be at least 1 characters long"),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ success: "false", message: "Invalid input", errors: errors.array() });
			return;
		}
		const { id } = req.body;
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (await verifyToken(token)) {
			const list = await prisma.list.delete({ where: { id } });
			console.log("list: ", list);
			res.status(200).json({ success: "true", message: list });
		} else {
			res.status(401).json({ success: "false", message: "Unauthorized" });
		}
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
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: "false", messaga: "Incorrect input", errors: errors.array() });
		}

		const { id, title } = req.body;
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (await verifyToken(token)) {
			const list = await prisma.list.update({ where: { id }, data: { title } });
			console.log("list: ", list);
			res.status(200).json({ success: "true", message: list });
		} else {
			res.status(401).json({ success: "false", message: "Unauthorized" });
		}
	});
