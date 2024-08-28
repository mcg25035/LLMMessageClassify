const {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
	ChatSession,
} = require("@google/generative-ai");
const dotenv = require("dotenv");

const apiKey = dotenv.config().parsed.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
	model: "gemini-1.5-flash",
});

const generationConfig = {
	temperature: 0.5,
	topP: 0.95,
	topK: 64,
	maxOutputTokens: 8192,
	responseMimeType: "text/plain",
};

class MessageCategory {
	static TASK = "Task";
	static TRADE = "Trade";
	static GLOBAL = "Global";
	static UNKNOWN = "Unknown";
}

class ApiSession {
	/** @type {ApiSession} */
	static instance;
	/** @type {ChatSession} */
	chatSession;

	/** @private */
	constructor() {
		this.chatSession = model.startChat({
			generationConfig,
			safetySettings: [
				{
					category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
					threshold: HarmBlockThreshold.BLOCK_NONE
				},
				{
					category: HarmCategory.HARM_CATEGORY_HARASSMENT,
					threshold: HarmBlockThreshold.BLOCK_NONE
				},
				{
					category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
					threshold: HarmBlockThreshold.BLOCK_NONE
				},
				{
					category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
					threshold: HarmBlockThreshold.BLOCK_NONE
				}
			],
			history: [
				{
					role: "user",
					parts: [
						{ text: "你是一個Minecraft生存伺服器的訊息分類機器人\n有點像API \n我會輸入一串訊息，你告訴我要送到哪個分類\n總共有4種分類\n任務(Task)、交易(Trade)、公共(Global)\n\n只回覆我分類對應的英文標籤就好，其他不要回覆\n\n範例：\n\"收一盒金磚四萬七 能到喜羊羊商店單賣 右手邊的收購商店\" -> Trade\n\"你居然現在才睡\" -> Global\n\"收死亡腦珊瑚（1000收\" -> Trade\n\"掛這麼久\" -> Global\n\"限時販售嗅探獸1顆200元，限量6顆要購買得[/spawn]\" -> Trade\n\"我重設定一下\" -> Global\n\"把粉末變成混泥土，3000\" -> Task\n\"all done\" -> Global\n\"找人幫忙蓋通天小麥塔 30000\" -> Task\n\"i can still use it\" -> Global\n\"急找一位分解工 將骨頭分解成骨粉 分解1盒骨頭350元\" -> Task\n\"i can still use it\" -> Global\n\"徵整地工，薪水3萬\" -> Task\n\" 好欸藍圖終於更新1.21.1了\" -> Global\n\n只回覆我分類對應的英文標籤\n但要追蹤上下幾個訊息內的語意來判斷\nA:你有比較器嗎? \nB:要多少 <-- 這就不是交易訊息\n交易的話不要把玩家日常遊玩的訊息搞混了\n要想像玩家的日常遊玩行動\n有很明確是交易的再分類成Trade 例如有商業用詞(收、售)並且同時有量詞的組合(多少、32組、16盒)\n\n回覆我ok即開始" },
					],
				},
				{
					role: "model",
					parts: [
						{ text: "ok \n" },
					],
				},
			],
		});
	}

	/** 
	 * @param {string} message
	 * @returns {Promise<String>}
	 */
	async getCategory(message) {
		const result = await this.chatSession.sendMessage(message);
		if (result.response.text().includes("Task")) return MessageCategory.TASK;
		if (result.response.text().includes("Trade")) return MessageCategory.TRADE;
		if (result.response.text().includes("Global")) return MessageCategory.GLOBAL;
		return MessageCategory.UNKNOWN;
	}
	
	/** @returns {Promise<ApiSession>} */
	static async getInstance() {
		if (!ApiSession.instance) {
			ApiSession.instance = new ApiSession();
		}
		return ApiSession.instance;
	}

	/** @returns {Promise<void>} */
	static async refresh() {
		ApiSession.instance = new ApiSession();
	}
}

module.exports = ApiSession