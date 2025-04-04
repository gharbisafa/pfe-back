class RecordNotFoundError extends Error {
	constructor(model, _id) {
		let message = `No record with the id '${_id}' was found in ${model.collection.name} collection`;
		super(message);
		this.model = model;
		this._id = _id;
	}
}

module.exports = RecordNotFoundError;
