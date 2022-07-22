import { Server } from "../server/server";
import supertest from "supertest";
import assert from "assert";

const app = new Server();
app.start();

describe("Auth", () => {
	describe("login", () => {
		it("should return a token", async () => {
			await supertest(app.app)
				.post("/auth/login").send({
					login: "admin",
					password: "admin" })
				.expect("Content-Type", /json/)
				.expect(200)
				.then(response => {
					assert(response.body.success, "false");
					assert(response.body.token, "token");
					done();
				});
		});
	});
});
function done() {
	console.log("done");
}

