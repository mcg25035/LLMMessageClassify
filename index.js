
const express = require("express");
const ApiSession = require("./LLM");
const dotenv = require("dotenv");
const authToken = dotenv.config().parsed.Auth

const app = express();
app.use(express.json());

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Boolean}
 */
function authConnection(req, res) {
	if (req.headers.authorization !== authToken) {
		res.status(401).json({ message: "Unauthorized" });
		res.end();
		return false;
	}
	return true;
}

app.post("/getCategory", async (req, res) => {
	if (!authConnection(req, res)) return;
	const { message, sender } = req.body;
	const apiSession = await ApiSession.getInstance();
	const category = await apiSession.getCategory(sender + " : " + message);
	res.json({ category });
});

app.get("/refresh", async (req, res) => {
	if (!authConnection(req, res)) return;
	await ApiSession.refresh();
	res.json({ message: "refreshed" });
});

app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});
