import jwt from "jsonwebtoken";
import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { AUTH, ERROR, MSG } from "../../constants";
import bcrypt from "bcrypt";

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
 *         - user
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "You've signed up, your token is valid for 1h"
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsNXBleWZjcDAwMDI1d3RhamFpYTFqY2MiLCJpYXQiOjE2NTgwNjgxMzIsImV4cCI6MTY1ODA3MTczMn0.5EPU0LzjBdK5gm3lp_f49C-yM5vu4eWHDALLXHCk7sg"
 *         user:
 *           type: object
 *           required:
 *             - id
 *             - login
 *           properties:
 *             id:
 *               type: string
 *               example: "cl5pf2wpf000004tal8ai4dus"
 *             login:
 *               type: string
 *               example: "admin"
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
 *           $ref: '#/components/responses/InvalidInput'
 *         409: 
 *           description: User already exists
 *         444:
 *           $ref: '#/components/responses/JSONParseError'
*/
Auth.post("/register",
	body("login").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString).isLength(AUTH.LOGIN).withMessage(AUTH.LOGIN.message),
	body("password").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString).isLength(AUTH.PASSWORD).withMessage(AUTH.PASSWORD.message),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json(ERROR[ 400 ](errors.array()));
		// Check if user is already registered
		const { login, password } = req.body;
		const user = await prisma.user.findUnique({ where: { login } });
		if (user)
			return res.status(409).json({ success: false, message: "User already exists" });
		// Create user
		const newUser = await prisma.user.create({ data: { login, password:  await bcrypt.hash(password, 10) } });
		const token = jwt.sign({ id: newUser.id }, `${process.env.JWT_SECRET}`, { expiresIn: AUTH.TOKEN_VALIDATION_TIME });
		res.status(200).header("Authorization", `Bearer ${token}`).json({
			success: true,
			message: AUTH.SIGNED_UP,
			token,
			user: { login: newUser.login, id: newUser.id },
		});
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
 *           $ref: '#/components/responses/InvalidInput'
 *         404: 
 *           description: User not found
 *         406:
 *           description: Wrong password
 *         444:
 *           $ref: '#/components/responses/JSONParseError'
*/
Auth.post("/login",
	body("login").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString).isLength(AUTH.LOGIN).withMessage(AUTH.LOGIN.message),
	body("password").exists({ checkFalsy: true }).withMessage(MSG.exists).isString().withMessage(MSG.isString).isLength(AUTH.PASSWORD).withMessage(AUTH.PASSWORD.message),
	async (req: express.Request, res: express.Response) => {
		// Check if input is valid
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json(ERROR[ 400 ](errors.array()));
		// Check if user is registered
		const { login, password } = req.body;
		const user = await prisma.user.findUnique({ where: { login } });
		if (!user)
			return res.status(404).json({ success: false, message: "User not found" });
		// Check if password is correct
		if (!await bcrypt.compare(password, user.password))
			return res.status(406).json({ success: false, message: "Wrong password" });
		// Login user and send token
		const token = jwt.sign({ id: user.id }, `${process.env.JWT_SECRET}`, { expiresIn: AUTH.TOKEN_VALIDATION_TIME });
		res.status(200).header("Authorization", `Bearer ${token}`).json({
			success: true,
			message: AUTH.SIGNED_IN,
			token,
			user: { login: user.login, id: user.id },
		});
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
