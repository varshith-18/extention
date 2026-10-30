const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

const generateResponse = async (req, res) => {
  try {
    const { prompt, code } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    if (
      !process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY === "replace_with_your_groq_api_key"
    ) {
      return res.status(500).json({
        success: false,
        message: "Set a valid GROQ_API_KEY in backend/.env",
      });
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are an expert programming assistant. Give clear and detailed responses.",
            },
            {
              role: "user",
              content: `User Request:\n${prompt}\n\nProvided Code:\n${code || "No code provided"}`,
            },
          ],
        }),
      },
    );

    const data = await groqResponse.json();
    if (!groqResponse.ok) {
      throw new Error(
        data.error?.message ||
          `Groq API request failed with status ${groqResponse.status}`,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Response generated successfully",
      result:
        data.choices?.[0]?.message?.content ||
        "Groq returned an empty response",
    });
  } catch (error) {
    console.error("Groq API Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate response",
    });
  }
};

const parseQuizResponse = (content) => {
  const fencedJson = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const jsonText =
    fencedJson ||
    content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);

  if (!jsonText) {
    throw new Error("Groq returned a response without quiz JSON");
  }

  return JSON.parse(jsonText);
};

app.post("/quiz", async (req, res) => {
  try {
    const { code, numberOfQuestions = 5 } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide code to generate a quiz",
      });
    }

    if (
      !process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY === "replace_with_your_groq_api_key"
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Quiz generation is not configured. Set a valid GROQ_API_KEY in backend/.env.",
      });
    }

    const count = Math.min(10, Math.max(1, Number(numberOfQuestions) || 5));

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are an expert programming instructor. Return only the requested JSON object, with no markdown or additional text.",
            },
            {
              role: "user",
              content: `
Generate exactly ${count} multiple-choice questions based on the following code.
Each question must have exactly 4 options, only one correct answer, and a clear explanation.
Include conceptual and output-based questions that test the code. Return this exact JSON shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"answerIndex":0,"explanation":"..."}]}

CODE:
${code}
                        `,
            },
          ],
        }),
      },
    );

    const data = await groqResponse.json();
    if (!groqResponse.ok) {
      throw new Error(
        data.error?.message ||
          `Groq API request failed with status ${groqResponse.status}`,
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Groq returned an empty quiz response");
    }

    const quiz = parseQuizResponse(content);

    if (
      !Array.isArray(quiz.questions) ||
      quiz.questions.length !== count ||
      quiz.questions.some(
        (q) =>
          typeof q.question !== "string" ||
          !Array.isArray(q.options) ||
          q.options.length !== 4 ||
          !Number.isInteger(q.answerIndex) ||
          q.answerIndex < 0 ||
          q.answerIndex > 3 ||
          typeof q.explanation !== "string",
      )
    ) {
      throw new Error("Groq returned an invalid quiz format");
    }

    return res.status(200).json({
      success: true,
      questions: quiz.questions,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate quiz",
    });
  }
});

app.post(["/generate", "/input"], generateResponse);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    port: process.env.PORT || 5000,
  });
});

module.exports = app;
