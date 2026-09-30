const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const axios = require("axios");

require("dotenv").config();

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const News = require("./model/News");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ======================================================
// MONGODB
// ======================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");
  })
  .catch((error) => {
    console.log("MongoDB Connection Error:", error.message);
  });

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {
  res.send("NewsVerity Backend is Running Successfully!");
});

// ======================================================
// CLEAN AI RESPONSE
// ======================================================

function cleanAIResponse(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  let cleaned = text.trim();

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json/gi, "");
  cleaned = cleaned.replace(/```/g, "");
  cleaned = cleaned.trim();

  // Sometimes AI adds text before JSON
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

// ======================================================
// PARSE AI JSON
// ======================================================

function parseAIResponse(text) {
  const cleaned = cleanAIResponse(text);

  if (!cleaned) {
    throw new Error("AI returned an empty response.");
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.log("Unable to parse AI JSON.");
    console.log("Raw AI Response:", text);

    throw new Error("AI returned invalid JSON.");
  }
}

// ======================================================
// NORMALIZE RESULT
// ======================================================

function normalizeResult(result) {
  const allowedVerdicts = [
    "Likely True",
    "Likely False",
    "Misleading",
    "Needs Verification",
  ];

  let verdict = result?.verdict;

  if (!allowedVerdicts.includes(verdict)) {
    verdict = "Needs Verification";
  }

  let confidence = Number(result?.confidence);

  if (!Number.isFinite(confidence)) {
    confidence = 50;
  }

  confidence = Math.round(confidence);

  if (confidence < 0) confidence = 0;
  if (confidence > 100) confidence = 100;

  const allowedRisk = ["Low", "Medium", "High"];

  let riskLevel = result?.riskLevel;

  if (!allowedRisk.includes(riskLevel)) {
    riskLevel = "Medium";
  }

  return {
    verdict,

    confidence,

    summary:
      typeof result?.summary === "string" && result.summary.trim()
        ? result.summary.trim()
        : "The submitted claim requires further verification.",

    reason:
      typeof result?.reason === "string" && result.reason.trim()
        ? result.reason.trim()
        : "The available information is not sufficient to establish the accuracy of the claim.",

    riskLevel,

    recommendation:
      typeof result?.recommendation === "string" &&
      result.recommendation.trim()
        ? result.recommendation.trim()
        : "Verify the claim using multiple reliable and independent sources.",
  };
}

// ======================================================
// AI ANALYSIS
// ======================================================

app.post("/api/check-news", async (req, res) => {
  try {
    const { news } = req.body;

    // --------------------------------------------------
    // INPUT VALIDATION
    // --------------------------------------------------

    if (!news || typeof news !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please enter a news headline or article.",
      });
    }

    const cleanNews = news.trim();

    if (cleanNews.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter at least 10 characters.",
      });
    }

    // --------------------------------------------------
    // API KEY
    // --------------------------------------------------

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        message:
          "OpenRouter API key is missing. Check your .env file.",
      });
    }

    // --------------------------------------------------
    // UNIQUE REQUEST ID
    // --------------------------------------------------

    const requestId =
      Date.now().toString() +
      "-" +
      Math.random().toString(36).substring(2, 8);

    console.log("\n====================================");
    console.log("NEWS ANALYSIS REQUEST:", requestId);
    console.log("====================================");
    console.log(cleanNews);

    // --------------------------------------------------
    // PROFESSIONAL PROMPT
    // --------------------------------------------------

    const prompt = `
You are NewsVerity AI, a professional news claim analysis engine.

Analyze ONLY the specific news text supplied below.

VERY IMPORTANT:

The submitted news is the actual subject of this analysis.

You MUST pay attention to the exact:
- people
- organizations
- locations
- dates
- numbers
- events
- claims
- causes
- quotations
- sources mentioned
- wording

Do NOT give the same generic analysis to every article.

Two different news articles should receive different:
- verdicts when appropriate
- confidence scores
- summaries
- reasons
- risk levels
- recommendations

Do NOT pretend that you searched Google or the internet.

Do NOT claim that you verified external sources.

Use your general knowledge only when useful, but clearly distinguish between:
1. what can be reasonably assessed from the text
2. what requires external verification

Consider:

1. Factual plausibility
2. Internal consistency
3. Specific details
4. Unsupported claims
5. Sensational language
6. Exaggeration
7. Logical contradictions
8. Missing context
9. Whether the claim conflicts with well-established knowledge
10. Whether the article provides identifiable evidence or sources

VERDICT RULES:

"Likely True"
Use when the claim appears consistent with established information and there are no major warning signs.

"Likely False"
Use when the claim clearly conflicts with established facts or contains strong evidence of being false.

"Misleading"
Use when the statement contains a partially true claim, exaggerated interpretation, missing context, or wording that could create a false impression.

"Needs Verification"
Use when there is not enough information to determine whether the claim is true or false.

CONFIDENCE:

Give a realistic number from 0 to 100.

Do NOT always use 50.

Do NOT always use the same confidence.

The confidence should depend on the strength of the evidence contained in the submitted text.

RISK:

Low = unlikely to cause serious harm if misunderstood.

Medium = could meaningfully mislead people.

High = could potentially cause significant harm, panic, financial loss, health misinformation, or unsafe behavior.

Return ONLY one valid JSON object.

Do NOT use markdown.

Do NOT write anything before or after the JSON.

Use EXACTLY these keys:

{
  "verdict": "Likely True",
  "confidence": 75,
  "summary": "Short article-specific summary.",
  "reason": "Detailed article-specific explanation.",
  "riskLevel": "Low",
  "recommendation": "Specific next step for this claim."
}

NEWS TO ANALYZE:

${cleanNews}
`;

    // --------------------------------------------------
    // OPENROUTER REQUEST
    // --------------------------------------------------

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        // FREE OPENROUTER MODEL ROUTER
        model: "openrouter/free",

        messages: [
          {
            role: "system",
            content:
              "You are NewsVerity AI. Analyze each submitted news claim independently. Return only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.4,

        max_tokens: 1200,
      },
      {
        headers: {
          Authorization:
            `Bearer ${process.env.OPENROUTER_API_KEY}`,

          "Content-Type": "application/json",

          "HTTP-Referer":
            "http://localhost:5173",

          "X-Title":
            "NewsVerity - AI News Analysis",
        },

        timeout: 60000,
      }
    );

    // --------------------------------------------------
    // GET AI CONTENT
    // --------------------------------------------------

    const aiContent =
      response.data?.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.log("OpenRouter returned no content.");

      return res.status(502).json({
        success: false,
        message:
          "The AI service did not return an analysis. Please try again.",
      });
    }

    console.log("\nAI RAW RESPONSE:");
    console.log(aiContent);

    // --------------------------------------------------
    // PARSE
    // --------------------------------------------------

    let parsedResult;

    try {
      parsedResult = parseAIResponse(aiContent);
    } catch (parseError) {
      console.log(
        "AI JSON Error:",
        parseError.message
      );

      return res.status(502).json({
        success: false,
        message:
          "The AI returned an unexpected response. Please try again.",
      });
    }

    // --------------------------------------------------
    // NORMALIZE
    // --------------------------------------------------

    const finalResult =
      normalizeResult(parsedResult);

    console.log("\nFINAL RESULT:");
    console.log(finalResult);

    // --------------------------------------------------
    // SAVE TO MONGODB
    // --------------------------------------------------

    try {
      const newsData = new News({
        news: cleanNews,

        prediction:
          finalResult.verdict,

        confidence:
          `${finalResult.confidence}%`,

        summary:
          finalResult.summary,

        reason:
          finalResult.reason,

        riskLevel:
          finalResult.riskLevel,

        recommendation:
          finalResult.recommendation,
      });

      await newsData.save();

      console.log(
        "News analysis saved to MongoDB!"
      );
    } catch (dbError) {
      console.log(
        "MongoDB Save Error:",
        dbError.message
      );

      // AI result can still be returned
    }

    // --------------------------------------------------
    // SEND TO FRONTEND
    // --------------------------------------------------

    return res.json({
      success: true,

      prediction:
        finalResult.verdict,

      confidence:
        `${finalResult.confidence}%`,

      summary:
        finalResult.summary,

      reason:
        finalResult.reason,

      riskLevel:
        finalResult.riskLevel,

      recommendation:
        finalResult.recommendation,

      checkedAt:
        new Date().toISOString(),
    });

  } catch (error) {
    console.log("\n====================================");
    console.log("AI ANALYSIS ERROR");
    console.log("====================================");

    console.log(
      error.response?.data ||
      error.message
    );

    // --------------------------------------------------
    // RATE LIMIT
    // --------------------------------------------------

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "The free AI model is temporarily busy. Please wait a few seconds and try again.",
      });
    }

    // --------------------------------------------------
    // AUTH ERROR
    // --------------------------------------------------

    if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      return res.status(error.response.status).json({
        success: false,
        message:
          "OpenRouter API key is invalid or unauthorized. Please check your API key.",
      });
    }

    // --------------------------------------------------
    // MODEL / OPENROUTER ERROR
    // --------------------------------------------------

    if (error.response?.status === 404) {
      return res.status(502).json({
        success: false,
        message:
          "The selected free AI model is currently unavailable. Please try again.",
      });
    }

    // --------------------------------------------------
    // SERVER ERROR
    // --------------------------------------------------

    return res.status(500).json({
      success: false,
      message:
        "Unable to analyze the news right now. Please try again.",
    });
  }
});

// ======================================================
// GET HISTORY
// ======================================================

app.get("/api/history", async (req, res) => {
  try {
    const history = await News.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      history,
    });

  } catch (error) {
    console.log(
      "History Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load news history.",
    });
  }
});

// ======================================================
// DELETE ONE HISTORY
// ======================================================

app.delete("/api/history/:id", async (req, res) => {
  try {
    const deletedNews =
      await News.findByIdAndDelete(
        req.params.id
      );

    if (!deletedNews) {
      return res.status(404).json({
        success: false,
        message:
          "History item not found.",
      });
    }

    res.json({
      success: true,
      message:
        "History item deleted successfully.",
    });

  } catch (error) {
    console.log(
      "Delete Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to delete history item.",
    });
  }
});

// ======================================================
// CLEAR ALL HISTORY
// ======================================================

app.delete("/api/history", async (req, res) => {
  try {
    await News.deleteMany({});

    res.json({
      success: true,
      message:
        "All history cleared successfully.",
    });

  } catch (error) {
    console.log(
      "Clear History Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to clear history.",
    });
  }
});

// ======================================================
// SERVER
// ======================================================

const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );
});