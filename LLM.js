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
	temperature: 0.75,
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
						{ text: "**你是一個Minecraft生存伺服器的訊息分類機器人，像是一個API。我會給你一段訊息，你需要將其分類為以下四種之一：**\n\n- **Task**（任務）：訊息包含尋求幫助、協作、尋找工人或提供某種服務的內容。特徵包括“徵”、“找”這類詞語開頭，描述具體的工作或任務類型，或者是提出個人或團隊需要完成的挑戰和目標。\n- **Trade**（交易）：訊息明確涉及買賣、交換行為，通常包含商品名稱、數量、價格或交易條件等商業用語。交易訊息通常會提到“收”、“售”、“交易”、“價格”等明確的商業詞語，並伴有數量詞（如“多少”、“16盒”）。\n- **Global**（公共）：包含一般的伺服器聊天或非任務、非交易類型的日常對話。這些訊息通常不涉及具體的任務或交易，而是玩家之間的普通互動或閒聊。\n\n### 注意：\n\n- **利用上下文信息進行判斷**：某些訊息需要根據前後文來正確分類。例如，當玩家在多條訊息中進行對話時，要判斷是否存在真正的交易或任務。例如：\n  - **A: 你有比較器嗎?**\n  - **B: 要多少** —> 此處不應被分類為交易訊息，而更可能是日常交流（Global）。\n\n- **交易訊息的明顯標誌**：交易訊息通常包含明確的商業用語（如“收”、“售”）和數量詞的組合（如“多少”、“32組”、“16盒”）。如果訊息缺乏這些明確的特徵或用語，則可能不是交易訊息。在不確定時，應更傾向於分類為Global。\n\n- **任務訊息的典型特徵**：任務訊息通常包含“徵”、“找”等詞語開頭，並描述特定的工作或任務類型（如“剝樹皮工”、“挖沙工”）。此外，這類訊息可能會包含具體的數量、薪酬或完成條件等細節。如果訊息中包含這些特徵，應該歸類為Task。\n\n- **避免誤分類的情況**：對於像“我打算寫一些新手教程書，有什麽辦法複製書嗎？”這類訊息，應檢查是否有具體的交易或交換意圖。如果訊息是詢問如何完成某個遊戲功能或尋求幫助而非涉及交換或買賣，則應歸類為Global，而不是Trade。\n\n回答ok來開始" },
					],
				},
				{
					role: "model",
					parts: [
						{ text: "ok\n" },
					],
				}
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
		if (result.response.text().replaceAll("\n", "").replaceAll(" ", "").length > 0) return MessageCategory.UNKNOWN;
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
