import { PrismaClient } from "@prisma/client";
import consola, { Consola } from "consola";
import * as bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { Auth } from "./routes/Auth";
import { List } from "./routes/List";
import { Task } from "./routes/Task";
import * as dotenv from "dotenv";
import express, {  } from "express";
import cors from "cors";
import errorHandler from "./middleware/error-handler";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

export class Server {
	public app: express.Application;
	private logger: Consola = consola;
	private prisma: PrismaClient = new PrismaClient();

	constructor() {
		this.app = express();
	}

	public start() {
		this.setConfig();
		this.setRoutes();
		this.setRequestlogger();

		this.app.listen(process.env.PORT, () => {
			console.log(`Server running on localhost:${process.env.PORT}`);
			this.setSwagger();
		});
	}

	private setConfig() {
		dotenv.config();
		this.app.use(cors());
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.use(cookieParser());
		this.app.use(errorHandler);
	}

	private setRequestlogger() {
		this.app.use((req, _res, next) => {
			this.logger.info(`${req.method} ${req.url}`);
			next();
		});
	}

	private setRoutes() {
		this.app.get("/", (_req, res) => {
			res.send("Todo-list api");
		});

		this.app.use("/auth", Auth);
		this.app.use("/list", List);
		this.app.use("/task", Task);
	}

	private setSwagger() {
		const swaggerOptions = {
			definition: {
				openapi: "3.0.0",
				info: {
					title: "Task API",
					version: "1.0.0",
					description: "Task API",
				},
				servers: [
					{
						url: "http://localhost:4000",
						description: "Local server",
					},
				],
			},
			apis: ["./src/server/routes/*.ts", "./src/server/server.ts"],
		};
		const swaggerSpec = swaggerJSDoc(swaggerOptions);
		this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
	}
}
