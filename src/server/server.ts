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
			console.log(`Server running on port ${process.env.PORT}`);
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
			res.send("Hello World!");
		});

		this.app.use("/api/v1/auth", Auth);
		this.app.use("/api/v1/list", List);
		this.app.use("/api/v1/task", Task);
	}
}
