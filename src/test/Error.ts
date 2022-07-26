import assert from "assert";
import supertest from "supertest";
import { ERROR } from "../constants";
import { Method } from "../../typings/common";
import { app, Auth } from "./Auth";

class Error {
	/**
     * Send request to API with Invalid Input and check if it returns `400: Invalid input`
     * @throws assert error if response is not `400: Invalid input`
     * @param url - url of API endpoint
     * @param method - Method of API endpoint
     */
	static async error400(url: string, method: Method) {
		await supertest(app.app)[ method ](url)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.send({
				login: "",
				password: "",
				id: "",
				userId: "",
				listid: "",
				taskid: "",
				title: "",
				body: "",
				deadline: "2018-01-01 00:00:00",
				status: "someStatus",
				authorId: "",
			})
			.expect(400)
			.then(res => {
				assert.equal(res.body.success, false);
				assert.equal(res.body.message, ERROR[ 400 ]([]).message);
				assert.ok(res.body.errors);
			});
	}

	/**
     * Send request to API with invalid JSON and check if it returns `444: JSON parse error`
     * Throw assert error if response is not `444: JSON parse error`
     * @param url - url of API endpoint
     * @param method - Method of API endpoint
     */
	static async error444(url: string, method: Method) {
		await supertest(app.app)[ method ](url)
			.set("Content-Type", "application/json")
			.set("Accept", "application/json")
			.send("undefined")
			.expect(444)
			.then(res => {
				assert.equal(res.body.success, false);
				assert.equal(res.body.message, ERROR[ 444 ].message);
				assert.ok(res.body.error);
			});
	}

	static async error401(url: string, method: Method) {
		await supertest(app.app)[ method ](url)
			.set("Authorization", "Bearer Some_invalid_token")
			.send({
				login: "valid login",
				password: "valid password",
				id: "cl5pf2wpf000004tal8ai4dus",
				userId: "cl5pf2wpf000004tal8ai4dus",
				listId: "cl5pf2wpf000004tal8ai4dus",
				taskId: "cl5pf2wpf000004tal8ai4dus",
				title: "title",
				body: "body",
				deadline: "2023-01-01T00:00:00.000Z",
				status: "someStatus",
				authorId: "cl5pf2wpf000004tal8ai4dus",
			})
			.expect(401)
			.then(res => {
				assert.equal(res.body.success, false);
				assert.equal(res.body.message, ERROR[ 401 ].message);
			});
	}
}

export default Error;
