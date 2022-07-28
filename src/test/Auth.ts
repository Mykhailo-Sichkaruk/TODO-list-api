import supertest from "supertest";
import assert from "assert";
import { AUTH, ERROR, TEST } from "../constants";
import { Method } from "../../typings/common";
import { Server } from "./../server/server";
import Error from "./Error";

const app = new Server().testStart();

class Auth {
	public static url = "/auth";
	public static testUser = [{
		login: "test1",
		password: "test1",
		id: "",
		token: "",
	}, {
		login: "test2",
		password: "test2",
		id: "",
		token: "",
	}];

	static async #register200() {
	// Check if user is registered
		if (!await Auth.#isRegistered(Auth.testUser[ 0 ].login, Auth.testUser[ 0 ].password))
			Auth.testUser[ 0 ] = await Auth.#authUser("register", Auth.testUser[ 0 ].login, Auth.testUser[ 0 ].password);
		if (!await Auth.#isRegistered(Auth.testUser[ 1 ].login, Auth.testUser[ 1 ].password))
			Auth.testUser[ 1 ] = await Auth.#authUser("register", Auth.testUser[ 1 ].login, Auth.testUser[ 1 ].password);
	}

	static async #login200() {
		Auth.testUser[ 0 ] = await Auth.#authUser("login", Auth.testUser[ 0 ].login, Auth.testUser[ 0 ].password);
		Auth.testUser[ 1 ] = await Auth.#authUser("login", Auth.testUser[ 1 ].login, Auth.testUser[ 1 ].password);
	}

	static async #login406() {
		await supertest(app.app)
			.post("/auth/login")
			.send({
				login: TEST.USER_1.LOGIN,
				password: TEST.USER_1.PASSWORD + "randomString-qpowrhkdsajnzxcvb",
			})
			.expect("Content-Type", /json/)
			.expect(406)
			.then(res => {
				assert.deepEqual(res.body, { ...ERROR[ 406 ].LOGIN });
			});
	}

	static async #register406() {
		await supertest(app.app)
			.post("/auth/register")
			.send({
				login: TEST.USER_1.LOGIN,
				password: TEST.USER_1.PASSWORD,
			})
			.expect("Content-Type", /json/)
			.expect(409)
			.then(res => {
				assert.equal(res.body.success, false);
				assert.equal(res.body.message, "User already exists");
			});
	}

	static async #login404() {
		await supertest(app.app)
			.post("/auth/login")
			.send({
				login: TEST.USER_1.LOGIN + "randomString-qpowrhkdsajnzxcvb",
				password: TEST.USER_1.PASSWORD,
			})
			.expect("Content-Type", /json/)
			.expect(404)
			.then(res => {
				assert.equal(res.body.success, false);
				assert.equal(res.body.message, "User not found");
			});
	}

	/**
	 * API: Login or Register user
	 * @param login - login of user
	 * @param password - password of user
	 * @param auth - "login" | "register" - login or register user 
	 * @returns User object { token, id }
	 */
	static async #authUser(auth: string, login: string, password: string): Promise<UserTest> {
		return supertest(app.app)
			.post(`/auth/${auth}`)
			.send({ login, password })
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert(res.body.message === AUTH.SIGNED_IN || res.body.message === AUTH.SIGNED_UP);
				assert.equal(res.body.token.length, 172);
				assert.equal(res.body.user.login, login);
				assert.ok(res.body.user.id);
				return { token: res.body.token, id: res.body.user.id, login, password };
			});
	}

	static async #isRegistered(login: string, password: string): Promise<boolean> {
		return supertest(app.app)
			.post("/auth/login")
			.send({
				login,
				password,
			})
			.expect("Content-Type", /json/)
			.then(res => res.status === 200);
	}

	static testLogin() {
		it("200: Sign in", Auth.#login200);
		it("400: Invalid input", Error.error400.bind(null, "/auth/login", Method.POST));
		it("406: Wrong password", Auth.#login406);
		it("404: User not found", Auth.#login404);
		it("444: JSON parse error", Error.error444.bind(null, "/auth/login", Method.POST));
	}

	static testRegister() {
		it("200: Sign up", Auth.#register200);
		it("406: User already exists", Auth.#register406);
		it("400: Invalid input", Error.error400.bind(null, "/auth/register", Method.POST));
		it("444: JSON parse error", Error.error444.bind(null, "/auth/register", Method.POST));
	}

}

export { app, Auth };
