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

	static getAll() {
		it("200: Get list", List.#get200);
		it("401: Unauthorized", Error.error401.bind(null, "/list", Method.GET));
		it("444: JSON parse error", Error.error444.bind(null, "/list", Method.GET));
	}

	static post() {
		it("200: Add item", List.#post200);
		it("400: Invalid input", Error.error400.bind(null, "/list", Method.POST));
		it("401: Unauthorized", Error.error401.bind(null, "/list", Method.POST));
		it("444: JSON parse error", Error.error444.bind(null, "/list", Method.POST));
	}

	static delete() {
		it("200: Delete item", Error.error200.bind(null, "/list", Method.DELETE));
		it("401: Unauthorized", Error.error401.bind(null, "/list", Method.DELETE));
		it("444: JSON parse error", Error.error444.bind(null, "/list", Method.DELETE));
	}

}


export { list1, List };
