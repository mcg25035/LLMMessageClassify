
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

var queue = [];

async function runQueue() {
	if (queue.length == 0) return;
	await queue[0]();
	queue.shift();
	runQueue();
}

async function addToQueue(asyncFunction) {
	queue.push(asyncFunction);
	if (queue.length == 1) await runQueue();
}

app.post("/getCategory", (req, res) => {
	if (!authConnection(req, res)) return;
	addToQueue(async function () {
		const message = req.body.message;
		const instance = await ApiSession.getInstance();
		const category = await instance.getCategory(message);
		res.json({ category });
	});
});

app.get("/refresh", async (req, res) => {
	if (!authConnection(req, res)) return;
	addToQueue(async function () {
		await ApiSession.refresh();
		res.json({ message: "Refreshed" });
	});
});

app.listen(3087, () => {
	console.log("Server is running on http://localhost:3087");
});
