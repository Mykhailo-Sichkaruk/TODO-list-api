import express from "express";
import cors from "cors";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import consola, {Consola} from "consola";
import { PrismaClient } from "@prisma/client";
import { Auth } from "./routes/Auth";

export class Server {
    public  app: express.Application;
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
        console.log(process.env.JWT_SECRET);
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: true}));
    }

    private setRequestlogger() {
        this.app.use((req, res, next) => {
            this.logger.info(`${req.method} ${req.url}`);
            next();
        });
    }

    private setRoutes() {
        this.app.get("/", (req, res) => {
            res.send("Hello Worlddd");
        });

        this.app.use("/api/v1/", Auth);
    }   

}