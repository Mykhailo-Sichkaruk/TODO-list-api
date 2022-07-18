const AUTH = Object.freeze({
	PASSWORD: {
		min: 3,
		max: 255,
	},
	LOGIN: {
		min: 3,
		max: 255,
	},
	TOKEN_VALIDATION_TIME: "1h",
});

export { AUTH };
