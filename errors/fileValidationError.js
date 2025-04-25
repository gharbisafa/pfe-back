class FileValidationError extends Error {
	constructor(file) {
		let message = "File Validation Error";
		super(message);
		this.file = file;
	}
}

module.exports = FileValidationError;