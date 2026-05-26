import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Traditional Chinese system instruction for standard high-quality business summaries and translation
const SYSTEM_INSTRUCTIONS = `
你是一個專業的助理、會議書記官與翻譯大師。
你的職責是將使用者提供的「會議逐字稿」、「重點筆記」或「對話內容」整理為高品質、結構化、語氣專業且極具可讀性的「會議記錄與摘要報告」，並依需求提供精準的語言翻譯。

請遵循以下最高準則：
1. 語系與習慣：所有內容均需以「繁體中文（台灣常用商務與資訊術語，如：專案、資訊、優化、軟體、行銷、時程）」撰寫，文字通順，避免簡體字或對岸用語。
2. 結構格式：使用清晰、美觀、層次分明的 Markdown 語法排版，善用 Emoji 圖示、粗體與合適的標題，讓內容生動且容易閱讀。
3. 會議記錄大綱架構：
   - 📅 **會議基本資訊**
     - **會議主題**：(若能從逐字稿分析，否則寫「未在逐字稿中提及，建議手動填寫」)
     - **與會人員**：(條列出發言者或提及的人員，若分析不出則寫「未偵測到明確名單」)
     - **報告摘要時間**：${new Date().toISOString().split('T')[0]} (台灣標準時間格式)
   - 🎯 **會議核心摘要**
     - 用 2-3 個段落，深入淺出地綜整會議召開的背景、當前現況及主要討論的核心議題。
   - 🔑 **重要決議與共識**
     - 以清晰的精簡清單，條列出會議中各方達成的一切決定、決議、政策或各項共識。
   - 🚀 **行動方案與待辦清單 (Action Items)**
     - 詳細列出後續待執行的工作。格式需為 Markdown 待辦工作清單：
       - [ ] **[負責人]** 任務詳細內容 (預計完成期限)
       - 如果逐字稿中沒有明確提到負責人或期限，請寫 **[待指派]** 或 **[時程待確認]**，以便使用者後續調整。
4. 🌐 多國語言對照翻譯（僅在使用者要求時才產生）：
   - 若使用者有指定「翻譯語言」（例如：英文、日文、日語、韓文、韓語），請在中文會議記錄的尾端，新增一個名為「🌐 多國對照翻譯」的第二大區塊。
   - 在該區塊中，將「會議主題」、「會議核心摘要」與「重要決議與共識」轉換為該對應之精準商務語言，並維持優秀的排版結構。
5. 嚴謹性與事實基礎：不要憑空捏造會議未討論之數據、決策或承諾。若資訊模糊或不足，請誠實註明。
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  // Initialize GoogleGenAI SDK
  let ai: GoogleGenAI | null = null;
  if (GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // API summarize endpoint
  app.post("/api/summarize", async (req, res) => {
    try {
      const { transcript, targetLanguage, styleOption } = req.body;

      if (!transcript || typeof transcript !== "string" || transcript.trim() === "") {
        return res.status(400).json({ error: "請貼上會議逐字稿或筆記內容。" });
      }

      if (!GEMINI_API_KEY || !ai) {
        return res.status(500).json({
          error: "伺服器偵測到您尚未設定 GEMINI_API_KEY！\n請先前往 AI Studio 介面左上角的「Settings > Secrets」面板，新增並設定您的 GEMINI_API_KEY 變數，方能正常體驗 AI 總結功能。"
        });
      }

      let stylePrompt = "";
      if (styleOption === "detailed") {
        stylePrompt = "這是一份需要「高度詳細」之會議報告。請在摘要中詳實記載各位發言人的核心論點、考量背景、來回討論的細節與技術探討細項。";
      } else if (styleOption === "executive") {
        stylePrompt = "這是一份給「高階管理階層 / Executive」閱讀的摘要。請摒棄冗長發言過程，直奔主題、提取核心關鍵數字。首重商業決策、行動方案、負責人與明確的成效驗收時程。";
      } else {
        stylePrompt = "這是一份「標準平衡版」會議報告。請提供中等詳細度的核心摘要、各項重要決議並條列待辦工作清單。";
      }

      let translationPrompt = "";
      if (targetLanguage && targetLanguage !== "none") {
        translationPrompt = `使用者指定需翻譯為目標語言：「${targetLanguage}」。請在報告底部，新增【🌐 多國對照翻譯】大區塊，轉譯會議主題、核心摘要與決議。`;
      }

      const prompt = `
請分析以下會議文字，並整理為高專業度的會議摘要報告。

[會議文字起點]
${transcript}
[會議文字終點]

[特別格式與排版自訂需求]
1. 會議記錄風格：${stylePrompt}
2. 翻譯要求：${translationPrompt || "不需要進行額外翻譯。僅輸出繁體中文會議報告。"}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTIONS,
          temperature: 0.2, // low temperature for precise summary without hallucinations
        },
      });

      const processedResult = response.text || "AI 生成失敗。遺憾未回傳任何文本。";
      return res.json({ result: processedResult });
    } catch (apiError: any) {
      console.error("Gemini API server side error:", apiError);
      return res.status(500).json({
        error: `AI 訊息處理失敗：${apiError?.message || "未知錯誤"}。如果您是在預覽模式下，請確認您已在 Secrets 管理中正確配置了有效的 GEMINI_API_KEY。`
      });
    }
  });

  // Serve static assets or mount Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting and listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server bootstrap failure:", err);
});
