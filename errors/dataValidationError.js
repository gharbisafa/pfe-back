class DataValidationError extends Error {
	constructor(model, issues) {
		let message =
			"Validation Errors :\n" +
			Object.values(issues)
				.map((error, index) => `\t[ERR-${index}]${error.message}`)
				.join("\n");
		super(message);
		this.model = model;
		this.issues = Object.values(issues);
	}
}

module.exports = DataValidationError;
