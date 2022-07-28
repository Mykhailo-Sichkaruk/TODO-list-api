import supertest from "supertest";
import assert from "assert";
import { Method } from "../../typings/common";
import Error from "./Error";
import { app, Auth } from "./Auth";

const list1 = "asdad";

class List {
	public static url = "/list";
	private static testList = [{
		title: "Test list 1",
		id: "",
	}];

	/**
     * Create new list
     * @throws {Error} - if request is not successful
     */
	static async #post200() {
		await supertest(app.app)
			.post(List.url)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.send({ title: List.testList[ 0 ].title })
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert.equal(res.body.message.title, List.testList[ 0 ].title);
				assert.ok(res.body.message.id);
				List.testList[ 0 ].id = res.body.message.id;
			});

		await supertest(app.app)
			.get(`${List.url}/${List.testList[ 0 ].id}`)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert.equal(res.body.message.title, List.testList[ 0 ].title);
				assert.equal(res.body.message.id, List.testList[ 0 ].id);
			});
	}

	static async #get200() {
		const id = await List.#createList();
		// Get all Lists, check if new list is in the list
		await supertest(app.app)
			.get(List.url)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert.ok(res.body.message);
				assert.equal(res.body.message.find((list: any) => list.id === id).title, List.testList[ 0 ].title);
			});
		// Delete created List
		List.#deleteList(id);
	}

	static async #createList(): Promise<string> {
		return supertest(app.app)
			.post(List.url)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.send({ title: List.testList[ 0 ].title })
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert.equal(res.body.message.title, List.testList[ 0 ].title);
				assert.ok(res.body.message.id);
				return res.body.message.id;
			});
	}

	static async #deleteList(id: string): Promise<void> {
		await supertest(app.app)
			.delete(`${List.url}`)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.send({ id })
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert.ok(res.body.message);
			});
	}

	static async #delete200() {
		const id = await List.#createList();
		await supertest(app.app)
			.delete(`${List.url}`)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.send({ id })
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert.ok(res.body.message);
			});
		// Check if list is deleted
		await supertest(app.app)
			.get(`${List.url}/${id}`)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.expect("Content-Type", /json/)
			.expect(404)
			.then(res => {
				assert.equal(res.body.success, false);
				assert.equal(res.body.message, "List not found");
			});
	}

	static async #notFound(method: Method, path: string): Promise<void> {
		await supertest(app.app)[ method ](`${List.url}/${path}`)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.send({ id: "anyrandomid", title: "anyrandomtitle", userId: "not existing", listId: "not existing" })
			.expect("Content-Type", /json/)
			.expect(404)
			.then(res => {
				assert.equal(res.body.success, false);
				assert.equal(res.body.message, "List not found");
			});
	}

	static async #delete406() {
		await supertest(app.app)
			.delete(`${List.url}`)
			.set("Authorization", `Bearer ${Auth.testUser[ 1 ].token}`)
			.send({ id: List.testList[ 0 ].id })
			.expect("Content-Type", /json/)
			.expect(406)
			.then(res => {
				assert.equal(res.body.success, false);
				assert.ok(res.body.message.startsWith("You are not member of"));
			});
	}

	static #getAll() {
		it("200: Get list", List.#get200);
		it("401: Unauthorized", Error.error401.bind(null, "/list", Method.GET));
	}

	static #post() {
		it("200: Add item", List.#post200);
		it("400: Invalid input", Error.error400.bind(null, "/list", Method.POST));
		it("401: Unauthorized", Error.error401.bind(null, "/list", Method.POST));
		it("444: JSON parse error", Error.error444.bind(null, "/list", Method.POST));
	}

	static #delete() {
		it("200: Delete item", List.#delete200);
		it("401: Unauthorized", Error.error401.bind(null, "/list", Method.DELETE));
		it("404: Not found", List.#notFound.bind(null, Method.DELETE, ""));
		it("444: JSON parse error", Error.error444.bind(null, "/list", Method.DELETE));
		it("406: You are not a member", List.#delete406);
	}

	static async #put200() {
		const id = await List.#createList();
		await supertest(app.app)
			.put(`${List.url}`)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.send({ id, title: "New title" })
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert.equal(res.body.message.title, "New title");
				assert.equal(res.body.message.id, id);
			});

		// Check if list is updated
		await supertest(app.app)
			.get(`${List.url}/${id}`)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert.equal(res.body.message.title, "New title");
				assert.equal(res.body.message.id, id);
			});
		// Delete list
		await List.#deleteList(id);
	}

	static async #put406() {
		const id = await List.#createList();
		await supertest(app.app)
			.put(`${List.url}`)
			.set("Authorization", `Bearer ${Auth.testUser[ 1 ].token}`)
			.send({ id, title: "New title" })
			.expect("Content-Type", /json/)
			.expect(406)
			.then(res => {
				assert.equal(res.body.success, false);
				assert.ok(res.body.message.startsWith("You are not member of"));
			});
		// Delete list
		await List.#deleteList(id);
	}

	static #put() {
		it("200: Update item", List.#put200);
		it("400: Invalid input", Error.error400.bind(null, "/list", Method.PUT));
		it("401: Unauthorized", Error.error401.bind(null, "/list", Method.PUT));
		it("404: Not found", List.#notFound.bind(null, Method.PUT, ""));
		it("444: JSON parse error", Error.error444.bind(null, "/list", Method.PUT));
		it("406: You are not a member", List.#put406);
	}

	static #getOne() {
		it("200: Get one", List.#getOne200);
		it("401: Unauthorized", Error.error401.bind(null, "/list/123456", Method.GET));
		it("404: Not found", List.#notFound.bind(null, Method.GET, ""));
	}

	static test() {
		describe("Get all", List.#getAll);
		describe("Post", List.#post);
		describe("Delete", List.#delete);
		describe("Put", List.#put);
		describe("Subscribe", List.#subscribe);
		describe("Get One", List.#getOne);
	}

	static #subscribe() {
		it("200: Subscribe", List.#subscribe200);
		it("401: Unauthorized", Error.error401.bind(null, "/list/subscribe", Method.POST));
		it("404: Not found", List.#notFound.bind(null, Method.POST, "subscribe"));
		it("444: JSON parse error", Error.error444.bind(null, "/list/subscribe", Method.POST));
	}

	static async #subscribe200() {
		const id = await List.#createList();
		await supertest(app.app)
			.post(`${List.url}/subscribe`)
			.set("Authorization", `Bearer ${Auth.testUser[ 0 ].token}`)
			.send({ userId: Auth.testUser[ 1 ].id, listId: id })
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert.equal(res.body.message, "Subscribed");
			});
		// Check if user is subscribed
		await supertest(app.app)
			.get(`${List.url}/`)
			.set("Authorization", `Bearer ${Auth.testUser[ 1 ].token}`)
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert.equal(res.body.message[ 0 ].id, id);
			});
		// Delete list
		await List.#deleteList(id);
	}

	static async #getOne200() {
		const id = await List.#createList();
		await supertest(app.app)
			.get(`${List.url}/${id}`)
			.set("Authorization", `Bearer ${Auth.testUser[ 1 ].token}`)
			.expect("Content-Type", /json/)
			.expect(200)
			.then(res => {
				assert.equal(res.body.success, true);
				assert.equal(res.body.message.title, List.testList[ 0 ].title);
				assert.equal(res.body.message.id, id);
			});
	}
	// Delete list

	// 	describe("get: GET", List.getAll);
	// describe("post: POST", List.post);
	// describe("put: PUT", () => {
	// // it("Success 200: Update item", put200);
	// 	it("Bad request 400", Error.error400.bind(null, "/list", Method.PUT));
	// 	it("Unauthorized 401", Error.error401.bind(null, "/list", Method.PUT));
	// 	// it("Not found 404", put404);
	// 	// it("Not a member of list 403", put403);
	// 	it("JSON parse error 444", Error.error444.bind(null, "/list", Method.PUT));
	// });

	// });
	// describe("subscribe: POST", () => {
	// // it("Success 200: Subscribe", subscribe200);
	// 	it("Bad request 400", Error.error400.bind(null, "/list/subscribe", Method.POST));
	// 	it("Unauthorized 401", Error.error401.bind(null, "/list/subscribe", Method.POST));
	// 	// it("Not found 404", subscribe404);
	// 	// it("Not a memver of list 403", subscribe403);
	// 	it("JSON parse error 444", Error.error444.bind(null, "/list/subscribe", Method.POST));
	// });


}


export { list1, List };
