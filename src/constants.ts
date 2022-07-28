const deepFreeze = (obj: any) => {
	Object.keys(obj).forEach(key => {
		if (typeof obj[ key ] === "object" && !Object.isFrozen(obj[ key ])) {
			deepFreeze(obj[ key ]);
		}
	});
	return Object.freeze(obj);
};

const ERROR = deepFreeze({
	400(errors: Array<any>) {
		return {
			success: false,
			message: "Invalid input",
			errors,
		};
	},
	401: {
		success: false,
		message: "Unauthorized. Please register or login and add response token to header.",
	},
	403: {
		message: "Forbidden",
		status: 403,
	},
	404: {
		LOGIN: {
			success: false,
			message: "User not found",
		},
	},
	406: {
		REGISTER: {
			success: false,
			message: "User already exists",
		},
		LOGIN: {
			success: false,
			message: "Wrong password",
		},
		LIST(list: any) {
			return {
				success: false,
				message: `You are not member of ${list.title}(${list.id}). \nPlease ask author of this Todo-list to add you`,
			};
		},
	},
	444: {
		success: false,
		message: "JSON parse error",
	},
});

const MSG = deepFreeze({
	exists: "Must exist and be not falsy",
	isString: "Must be string",
});

const TEST = deepFreeze({
	USER_1: {
		LOGIN: "testUser1",
		PASSWORD: "testUser1",
	},
	USER_2: {
		LOGIN: "testUser2",
		PASSWORD: "testUser2",
	},
});

const REQ = Object.freeze({ // Prototype for request objects
	TITLE: {
		min: 3,
		max: 255,
		message: "Title must be min 3, max 255 characters long",
	},
	BODY: {
		min: 3,
		max: 500,
		message: "Body must be min 3, max 500 characters long",
	},
	ID: {
		message: "Id must be provided",
		exists: "Id must be provided",
		isString: "Id must be a string",
	},
});

const auth = () => {
	const authProp = { // Properties for authentication request body
		LOGIN: Object.create(REQ.TITLE), // Using ptototypal inheritance to create a new object with the same properties as REQ.TITLE
		PASSWORD: Object.create(REQ.TITLE),
		TOKEN_VALIDATION_TIME: "1h", // Used to set token expiration time
		SIGNED_UP: "Signed up",
		SIGNED_IN: "Signed in",
	};
	authProp.SIGNED_UP = `You've registered, your token is valid for ${authProp.TOKEN_VALIDATION_TIME}`;
	authProp.SIGNED_IN =  `You've logined in, your token is valid for ${authProp.TOKEN_VALIDATION_TIME}`;
	authProp.LOGIN.message = "Login must be min 3, max 255 characters long";
	authProp.PASSWORD.message = "Password must be min 3, max 255 characters long";


	return deepFreeze(authProp);
};

const task = () => {
	const taskProp = Object.create(REQ); // Properties for list request body
	taskProp.STATUS = {
		values: ["ACTIVE", "DONE", "CLOSED", "IN_PROGRESS", undefined],
		message: "Status must be one of ACTIVE, DONE, CLOSED, IN_PROGRESS",
	};
	return deepFreeze(taskProp);
};

const AUTH = auth();
const TASK = task();
const LIST = deepFreeze(Object.create(REQ));


export { AUTH, LIST, TASK, ERROR, MSG, TEST };
