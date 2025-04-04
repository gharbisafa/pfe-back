const bcrypt = require("bcrypt");

const checkPassword = async (password, passwordHash) => {
	return await bcrypt.compare(password, passwordHash);
};

const hashPassword = async (password) => {
	return await bcrypt.hash(password, 10);
};

module.exports = {
	checkPassword,
	hashPassword,
};
