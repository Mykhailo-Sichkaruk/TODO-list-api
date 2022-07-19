import jwt from "jsonwebtoken";
import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { AUTH } from "../../constants";

export const Auth = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthRequest:
 *       type: object
 *       required:
 *         - login
 *         - password
 *       properties:
 *         login:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           example: "admin"
 *         password:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           example: "admin"
 *     AuthResponse:
 *       type: object
 *       required:
 *         - success
 *         - message
 *         - token
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Success"
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsNXBleWZjcDAwMDI1d3RhamFpYTFqY2MiLCJpYXQiOjE2NTgwNjgxMzIsImV4cCI6MTY1ODA3MTczMn0.5EPU0LzjBdK5gm3lp_f49C-yM5vu4eWHDALLXHCk7sg"
 * 
 */

/**
 * @swagger
 * paths:
 *   /auth/register:
 *     post:
 *       tags:
 *         - Auth
 *       summary: Register new user
 *       description: Register new user
 *       requestBody:
 *         required: true
 *         content: 
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRequest'
 *       responses:
 *         200: 
 *           description: Signed up, token generated
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AuthResponse'
 *         400:
 *           description: Incorrect input
 *         409: 
 *           description: User already exists
 *         444:
 *           description: JSON parse error
*/
Auth.post("/register",
	body("login").exists().isLength(AUTH.LOGIN).withMessage("Login must be min 3, max 255 characters long"),
	body("password").exists().isLength(AUTH.PASSWORD).withMessage("Login must be min 3, max 255 characters long"),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ success: "false", messaga: "Incorrect input", errors: errors.array() });
		// Check if user is already registered
		const { login, password } = req.body;
		const user = await prisma.user.findUnique({ where: { login } });
		if (user)
			return res.status(409).json({ success: "false", message: "User already exists" });
		// Create user
		const newUser = await prisma.user.create({ data: { login, password } });
		const token = jwt.sign({ id: newUser.id }, `${process.env.JWT_SECRET}`, { expiresIn: AUTH.TOKEN_VALIDATION_TIME });
		res.status(200).header("Authorization", `Bearer ${token}`).json({ success: "true", message: `You've signed up, your token is valid for ${AUTH.TOKEN_VALIDATION_TIME}`, token });
	});


/**
 * @swagger
 * paths:
 *   /auth/login:
 *     post:
 *       tags:
 *         - Auth
 *       summary: Login user
 *       description: Login user
 *       requestBody:
 *         required: true
 *         content: 
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRequest'
 *       responses:
 *         200: 
 *           description: Signed in 
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AuthResponse'
 *         400:
 *           description: Incorrect input
 *         404: 
 *           description: User not found
 *         406:
 *           description: Wrong password
*/
Auth.post("/login",
	body("login").exists().isLength(AUTH.LOGIN).withMessage("Login must be at least 3 characters long"),
	body("password").exists().isLength(AUTH.PASSWORD).withMessage("Password must be at least 3 characters long"),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ success: "false", messaga: "Invalid request", errors: errors.array() });
		// Check if user is registered
		const { login, password } = req.body;
		const user = await prisma.user.findUnique({ where: { login } });
		if (!user)
			return res.status(404).json({ success: "false", message: "User not found" });
		// Check if password is correct
		if (user.password !== password)
			return res.status(406).json({ success: "false", message: "Wrong password" });
		// Login user and send token
		const token = jwt.sign({ id: user.id }, `${process.env.JWT_SECRET}`, { expiresIn: AUTH.TOKEN_VALIDATION_TIME });
		res.status(200).header("Authorization", `Bearer ${token}`).json({ success: "true", message: `You've signed in, your token is valid for ${AUTH.TOKEN_VALIDATION_TIME}`, token });
	});

export function verifyToken(token: string) {
	try {
		jwt.verify(token, `${process.env.JWT_SECRET}`, { complete: true });
		return true;
	} catch (err) {
		return false;
	}
}

export function getTokenId(token: string) :string {
	const decoded = Buffer.from(token.split(".")[ 1 ] ?? "", "base64").toString() ?? "";
	try {
		return JSON.parse(decoded).id;
	} catch (err) {
		return "";
	}
}
