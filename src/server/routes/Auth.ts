import jwt from "jsonwebtoken";
import { Router } from "express";
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
 *           default: "admin"
 *         password:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           default: "admin"
 *     AuthResponse:
 *       type: object
 *       required:
 *         - success
 *         - message
 *         - token
 *       properties:
 *         success:
 *           type: boolean
 *           default: true
 *         message:
 *           type: string
 *           default: "Success"
 *         token:
 *           type: string
 *           default: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsNXBleWZjcDAwMDI1d3RhamFpYTFqY2MiLCJpYXQiOjE2NTgwNjgxMzIsImV4cCI6MTY1ODA3MTczMn0.5EPU0LzjBdK5gm3lp_f49C-yM5vu4eWHDALLXHCk7sg" 
 */

/**
* @swagger
* /auth/register:
*   post:
*     description: Register and get token
*     summary: Register and get token
*     requestBody:
*       required: true
*       content: 
*         application/json:
*           schema:
*             $ref: '#/components/schemas/AuthRequest'
*     responses:
*       200:
*         description: Success
*         content: 
*           application/json:
*             schema:
*               $ref: '#/components/schemas/AuthResponse'
*       400:
*         description: Invalid input
*         content:
*           application/json:
*       409: 
*         description: User already exists
*       444:
*         description: JSON parse error
*/
Auth.post("/register",
	body("login").exists().isLength(AUTH.LOGIN).withMessage("Login must be min 3, max 255 characters long"),
	body("password").exists().isLength(AUTH.PASSWORD).withMessage("Login must be min 3, max 255 characters long"),
	async (req, res) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: "false", messaga: "Incorrect input", errors: errors.array() });
		}
		// Check if user is already registered
		const { login, password } = req.body;
		const user = await prisma.user.findUnique({ where: { login } });
		if (user) {
			res.status(409).json({ success: "false", message: "User already exists" });
			return;
		}
		// Create user
		const newUser = await prisma.user.create({ data: { login, password } });
		const token = jwt.sign({ id: newUser.id }, `${process.env.JWT_SECRET}`, { expiresIn: "1h" });
		res.status(200).json({ success: "true", message: `You've signed up, your token is valid for ${AUTH.TOKEN_VALIDATION_TIME}`, token });
	});


/**
 * @swagger
 * /auth/login:
 *   get:
 *     summary: Login user
 *     description: Login user
 *     requestBody:
 *       required: true
 *       content: 
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *     responses:
 *       200: 
 *         description: Signed in 
 *       400:
 *         description: Incorrect input
 *       401: 
 *         description: User not found
 *       402:
 *         description: Wrong password
*/
Auth.get("/login",
	body("login").exists().isLength(AUTH.LOGIN).withMessage("Login must be at least 3 characters long"),
	body("password").exists().isLength(AUTH.PASSWORD).withMessage("Password must be at least 3 characters long"),
	async (req, res) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ success: "false", messaga: "Invalid request", errors: errors.array() });
		}
		// Check if user is registered
		const { login, password } = req.body;
		const user = await prisma.user.findUnique({ where: { login } });
		if (!user) {
			res.status(401).json({ success: "false", message: "User not found" });
			return;
		}
		// Check if password is correct
		if (user.password !== password) {
			res.status(402).json({ success: "false", message: "Wrong password" });
			return;
		}
		// Login user and send token
		const token = jwt.sign({ id: user.id }, `${process.env.JWT_SECRET}`, { expiresIn: "1h" });
		res.status(200).json({ success: "true", message: token });
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
