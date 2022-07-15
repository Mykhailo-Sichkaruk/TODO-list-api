import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

export const Auth = Router();
const prisma = new PrismaClient();

Auth.post("/register", async (req, res) => {
    const { login, password } = req.body;
    const user = await prisma.user.findUnique({
        where: {
            login,
        }
    });
    if (!user) {
        const result = await prisma.user.create({
            data: {
                login,
                password,
            }
        });

        const token = jwt.sign({ login }, `${process.env.JWT_SECRET}`, {expiresIn: "1h"});
        res.status(401).json({ success: "true", message: "token", token });
    } else {
        res.status(200).json({ success: "false", message: "user already exists" });
    }
});

Auth.post("/login", async (req, res) => {
    const user = await prisma.user.findUnique({
        where: {
            login: req.body.login,
        }
    });
    if (!user) {
        res.status(401).json({ message: "User not found" });
    } else {
        const token = jwt.sign({ id: user.id }, `${process.env.JWT_SECRET}`);
        res.status(200).json({ success: "true", message: "token", token });
    }
});