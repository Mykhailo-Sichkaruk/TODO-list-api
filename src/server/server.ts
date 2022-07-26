import errorHandler from "./middleware/error-handler";
import { PrismaClient } from "@prisma/client";
import swaggerUi from "swagger-ui-express";
import consola, { Consola } from "consola";
import * as bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import swaggerJSDoc from "swagger-jsdoc";
import { Auth } from "./routes/Auth";
import { List } from "./routes/List";
import { Task } from "./routes/Task";
import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";

export class Server {
	public app: express.Application;
	private logger: Consola = consola;
	private prisma: PrismaClient = new PrismaClient();

	constructor() {
		this.app = express();
	}

	public start() {
		this.setRequestlogger();
		this.setConfig();
		this.setRoutes();
		this.setSwagger();

		this.app.listen(process.env.PORT, () => {
			console.log(`Server running on localhost:${process.env.PORT}`);
			console.log(`Swagger docs available at http://localhost:${process.env.PORT}/docs/`);
		});

		return this;
	}

	public testStart() {
		this.setRequestlogger();
		this.setConfig();
		this.setRoutes();
		this.setSwagger();

		return this;
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
					title: "TODO-list API",
					version: "1.0.0",
					description: "TODO-list tasks API",
				},
				servers: [
					{
						url: `http://localhost:${process.env.PORT}`,
						description: "Local server",
					},
				],
				components: {
					securitySchemes: {
						bearerAuth: {
							type: "http",
							scheme: "bearer",
							name: "Authorization",
							description: "Bearer authentication",
							bearerFormat: "JWT",
							in: "header",
						},
					},
					security: [{ bearerAuth: [] }],
				},
			},
			apis: ["./src/server/routes/*.ts", "./src/server/server.ts"],
		};
		const swaggerSpec = swaggerJSDoc(swaggerOptions);
		this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
	}

	public end() {
		this.prisma.$disconnect();
	}

}
