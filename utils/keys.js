const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function generateKeypair() {
	const keyPair = crypto.generateKeyPairSync("rsa", {
		modulusLength: 4096,
		publicKeyEncoding: {
			type: "pkcs1",
			format: "pem",
		},
		privateKeyEncoding: {
			type: "pkcs1",
			format: "pem",
		},
	});

	fs.writeFileSync(
		path.join(path.join(process.cwd(), ".private", ".id_rsa_pub.pem")),
		keyPair.publicKey
	);

	fs.writeFileSync(
		path.join(process.cwd(), ".private", ".id_rsa_priv.pem"),
		keyPair.privateKey
	);
}

const getPrivKey = () => {
	const pathToKey = path.join(process.cwd(), ".private", ".id_rsa_priv.pem");
	return fs.readFileSync(pathToKey, "utf8");
};

const getPubKey = () => {
	const pathToKey = path.join(process.cwd(), ".private", ".id_rsa_pub.pem");
	return fs.readFileSync(pathToKey, "utf8");
};

module.exports = { generateKeypair, getPrivKey, getPubKey };
