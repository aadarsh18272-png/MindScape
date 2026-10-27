const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

console.log(
    "GEMINI KEY:",
    process.env.GEMINI_API_KEY ? "FOUND" : "MISSING"
);

router.post("/", async (req, res) => {
    console.log("AI TUTOR REQUEST RECEIVED");

    try {
        const { message, mode = "explain" } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required."
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "GEMINI_API_KEY is missing."
            });
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        const prompts = {
            explain: `
You are Mindscape AI Tutor.

Explain this topic clearly for a college student.

Structure your answer as:

1. Simple Definition
2. Key Points
3. Example
4. Exam Points

Use simple language and avoid unnecessary complexity.

Topic:
${message}
`,

            quiz: `
You are Mindscape AI Tutor.

Create a short quiz about this topic.

Ask ONE question at a time.
Do not give the answer immediately.

Topic:
${message}
`,

            summary: `
You are Mindscape AI Tutor.

Create concise study notes.

Include:
- Definition
- Main concepts
- Important points
- Examples
- Exam-focused points

Topic:
${message}
`,

            flashcards: `
You are Mindscape AI Tutor.

Create 5 study flashcards.

Format:

Q1:
Question

A1:
Answer

Q2:
Question

A2:
Answer

Continue until Q5.

Topic:
${message}
`
        };

        const prompt = prompts[mode] || prompts.explain;

        console.log(" Sending request to Gemini...");

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt
        });

        console.log(" Gemini response received");

        return res.json({
            success: true,
            reply: response.text
        });

    } catch (error) {
        console.error(" GEMINI ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "AI Tutor failed.",
            error: error.message
        });
    }
});

module.exports = router;
