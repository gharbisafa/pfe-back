const bcrypt = require("bcrypt");

const checkPassword = async (password, passwordHash) => {
	return await bcrypt.compare(password, passwordHash);
};

module.exports = {
	checkPassword,
};
