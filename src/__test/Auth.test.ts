import { Server } from "../server/server";
import supertest from "supertest";
import assert from "assert";
import { AUTH, ERROR, TEST } from "../constants";
jest.setTimeout(200000);

const app = new Server();
app.start();


let user1: UserTest = { token: "", id: "" };
let user2: UserTest = { token: "", id: "" };

describe("Auth", () => {
	describe("register: POST", () => {
		it("should 200: Sign up", register200);
		it("should 406: User already exists", register406);
		it("should 400: Invalid input", post400.bind(null, "/auth/register"));
		it("should 444: JSON parse error", post444.bind(null, "/auth/register"));
	});
	describe("login", () => {
		it("should 200: Sign in", login200);
		it("should 400: Invalid input", post400.bind(null, "/auth/login"));
		it("should 406: Wrong password", login406);
		it("should 404: User not found", login404);
		it("should 444: JSON parse error", post444.bind(null, "/auth/login"));
	});
});

async function register200() {
	// Check if user is registered
	if (!await isRegistered(TEST.USER_1.LOGIN, TEST.USER_1.PASSWORD))
		user1 = await authUser("register", TEST.USER_1.LOGIN, TEST.USER_1.PASSWORD);
	if (!await isRegistered(TEST.USER_2.LOGIN, TEST.USER_2.PASSWORD))
		user2 = await authUser("register", TEST.USER_2.LOGIN, TEST.USER_2.PASSWORD);

	assert(true);
}

async function login200() {
	// Login user1
	user1 = await authUser("login", TEST.USER_1.LOGIN, TEST.USER_1.PASSWORD);
}

/**
 * API: Login or Register user
 * @param login - login of user
 * @param password - password of user
 * @param auth - "login" | "register" - login or register user 
 * @returns User object { token, id }
 */
async function authUser(auth: string, login: string, password: string): Promise<UserTest> {
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
			return { token: res.body.token, id: res.body.user.id };
		});
}

async function register406() {
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

async function post400(url: string) {
	await supertest(app.app)
		.post(url)
		.set("Authorization", `Bearer ${user1.token}`)
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
		.expect("Content-Type", /json/)
		.expect(400)
		.then(res => {
			assert.equal(res.body.success, false);
			assert.equal(res.body.message, ERROR[ 400 ]([]).message);
			assert.ok(res.body.errors);
		});
}

async function post444(url: string) {
	await supertest(app.app)
		.post(url)
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

async function login406() {
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

async function login404() {
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

async function isRegistered(login: string, password: string): Promise<boolean> {
	return supertest(app.app)
		.post("/auth/login")
		.send({
			login,
			password,
		})
		.expect("Content-Type", /json/)
		.then(res => res.status === 200);
}

export { app, user1, user2 };
