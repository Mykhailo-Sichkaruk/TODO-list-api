/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { CustomError } from "./custom-error.model";

/**
 * Custom error handler to standardize error objects returned to
 * the client
 *
 * @param err Error caught by Express.js
 * @param _req Request object provided by Express
 * @param res Response object provided by Express
 * @param _next NextFunction function provided by Express
 */
function handleError(
	err: TypeError | CustomError,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	let customError = err;

	if (!(err instanceof CustomError)) {
		customError = new CustomError(err.message, 400);
	}

	res.status(444).json({
		success: "false",
		message: "Error",
		error: customError.message,
	});
}

export default handleError;
