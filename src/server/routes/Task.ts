import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getTokenId, verifyToken  } from "./Auth";
import { body } from "express-validator";

const prisma = new PrismaClient();
export const Task = Router();

Task.post("/",
	body("title").isString().isLength({ min: 1 }).withMessage("Title must be at least 1 characters long"),
	body("body").isString().isLength({ min: 1 }).withMessage("Body must be at least 1 characters long"),
	body("listId").notEmpty().withMessage("ListId must be provided"),
	body("status").isIn(["ACTIVE", "DONE", "CLOSED", "IN_PROGRESS"]).withMessage("Status must be : [ACTIVE, DONE, CLOSED, IN_PROGRESS]"),
	body("deadline").isISO8601().withMessage("Deadline must be a valid date"),
	async (req, res) => {
		const { title, body, listId, status, deadline } = req.body;
		if (listId === undefined) {
			res.status(400).json({ success: "false", message: "List id is required" });
			return;
		}

		const token = req.headers.authorization?.split(" ")[ 1 ] || "";
		const authorId = getTokenId(token);
		console.log("authorId: ", authorId);

		if (await verifyToken(token)) {
			const task = await prisma.task.create({ data: { title, body, listId, deadline, status, authorId } });
			console.log("task: ", task);
			res.status(200).json({ success: "true", message: task });
		} else {
			res.status(401).json({ success: "false", message: "Unauthorized" });
		}
	});

