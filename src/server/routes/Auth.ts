import jwt from "jsonwebtoken";
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { AUTH } from "../../constants";

export const Auth = Router();
const prisma = new PrismaClient();

Auth.post("/register",
	body("login").isLength({ min: AUTH.LOGIN_MIN_LENGTH }).withMessage("Login must be at least 3 characters long"),
	body("password").isLength({ min: AUTH.PASSWORD_MIN_LENGTH }).withMessage("Password must be at least 3 characters long"),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: "false", messaga: "Incorrect input", errors: errors.array() });
		}

		const { login, password } = req.body;
		const user = await prisma.user.findUnique({ where: { login } });

		if (!user) {
			const newUser = await prisma.user.create({ data: { login, password } });
			const token = jwt.sign({ id: newUser.id }, `${process.env.JWT_SECRET}`, { expiresIn: "1h" });
			res.status(401).json({ success: "true", message: `You've signed up, your token is valid for ${AUTH.TOKEN_VALIDATION_TIME}`, token });
		} else {
			res.status(200).json({ success: "false", message: "User already exists" });
		}
	});

Auth.post("/login",
	body("login").isLength({ min: 3 }).withMessage("Login must be at least 3 characters long"),
	body("password").isLength({ min: 3 }).withMessage("Password must be at least 3 characters long"),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: "false", messaga: "Incorrect input", errors: errors.array() });
		}

		const { login, password } = req.body;
		const user = await prisma.user.findUnique({ where: { login } });

		if (user) {
			if (user.password === password) {
				const token = jwt.sign({ id: user.id }, `${process.env.JWT_SECRET}`, { expiresIn: "1h" });
				res.status(200).json({ success: "true", message: token });
				console.log("token: ", token);
			} else {
				res.status(401).json({ success: "false", message: "Wrong password" });
			}
		} else {
			res.status(401).json({ success: "false", message: "User not found" });
		}
	});

export async function verifyToken(token: string) {
	try {
		return jwt.verify(token, `${process.env.JWT_SECRET}`, { complete: true });
	} catch (err) {
		return false;
	}
}

export function getTokenId(token: string) :string {
	return JSON.parse(Buffer.from(token.split(".")[ 1 ], "base64").toString()).id;
}
