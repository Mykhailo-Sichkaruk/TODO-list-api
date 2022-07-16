import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getTokenId, verifyToken } from "./Auth";
import { body, validationResult } from "express-validator";

const prisma = new PrismaClient();

export const List = Router();

List.post("/",
	body("title").isLength({ min: 1 }).withMessage("Title must be at least 1 characters long"),

	async (req, res) => {
		const { name } = req.body;
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";

		if (await verifyToken(token)) {
			const list = await prisma.list.create({ data: { name, subscribers: { connect: { id: getTokenId(token) } } } });
			console.log("list: ", list);
			res.status(200).json({ success: "true", message: list });
		} else {
			res.status(401).json({ success: "false", message: "Unauthorized" });
		}
	});

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
 * Update list name
 * @param {string} id
 * @param {string} title
 */
List.put("/",
	body("id").isString().isLength({ min: 1 }).withMessage("Id must be at least 1 characters long"),
	body("name").isString().isLength({ min: 1 }).withMessage("Name must be at least 1 characters long"),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: "false", messaga: "Incorrect input", errors: errors.array() });
		}

		const { id, name } = req.body;
		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		if (await verifyToken(token)) {
			const list = await prisma.list.update({ where: { id }, data: { name } });
			console.log("list: ", list);
			res.status(200).json({ success: "true", message: list });
		} else {
			res.status(401).json({ success: "false", message: "Unauthorized" });
		}
	});
