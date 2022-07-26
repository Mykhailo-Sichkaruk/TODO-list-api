import { Method } from "./../../typings/common";
import { List } from "./List";
import { Auth } from "./Auth";
import Error from "./Error";

describe("sequentially run tests", () => {
	describe("Autentication", () => {
		describe("register: POST", Auth.testRegister);
		describe("login", Auth.testLogin);
	});
	describe("List", () => {
		describe("get: GET", List.getAll);
		describe("post: POST", List.post);
		describe("put: PUT", () => {
		// it("Success 200: Update item", put200);
			it("Bad request 400", Error.error400.bind(null, "/list", Method.PUT));
			it("Unauthorized 401", Error.error401.bind(null, "/list", Method.PUT));
			// it("Not found 404", put404);
			// it("Not a member of list 403", put403);
			it("JSON parse error 444", Error.error444.bind(null, "/list", Method.PUT));
		});
		describe("delete: DELETE", () => {
		// it("Success 200: Delete item", delete200);
			it("Bad request 400", Error.error400.bind(null, "/list", Method.DELETE));
			it("Unauthorized 401", Error.error401.bind(null, "/list", Method.DELETE));
			// it("Not found 404", delete404);
			// it("Not a member of list 403", delete403);
			it("JSON parse error 444", Error.error444.bind(null, "/list", Method.DELETE));
		});
		describe("subscribe: POST", () => {
		// it("Success 200: Subscribe", subscribe200);
			it("Bad request 400", Error.error400.bind(null, "/list/subscribe", Method.POST));
			it("Unauthorized 401", Error.error401.bind(null, "/list/subscribe", Method.POST));
			// it("Not found 404", subscribe404);
			// it("Not a memver of list 403", subscribe403);
			it("JSON parse error 444", Error.error444.bind(null, "/list/subscribe", Method.POST));
		});
	});
});
