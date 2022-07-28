import { List } from "./List";
import { Auth } from "./Auth";

describe("Test", () => {
	describe("Autentication", () => {
		describe("register", Auth.testRegister);
		describe("login", Auth.testLogin);
	});
	describe("List", List.test);
});
