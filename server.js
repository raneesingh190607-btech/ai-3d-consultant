require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let chatHistory = [];

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const role = req.body.role || "helpful expert";

        let messages = [
            { 
              role: 'system', 
              content: `You are a highly experienced ${role}. Explain things clearly. 
              
              CRITICAL FORMATTING RULES:
              - NEVER use asterisks (**) or hashtags (#) for formatting. 
              - If you show math, use standard LaTeX formatting wrapped in single dollar signs (e.g., $x = 5$).
              - Speak like a normal human.

              VISUAL RULES (Very Important):
              - If the user asks for a picture, photo, image, or visual explanation of a topic, you MUST generate an image using this exact format:
                <img src="https://image.pollinations.ai/prompt/YOUR_SEARCH_TERM_HERE?width=600&height=350&nologo=true" style="max-width:100%; border-radius:8px; margin-top:10px;" />
              - Replace YOUR_SEARCH_TERM_HERE with a highly descriptive, comma-separated list of keywords (e.g., "red,apple,fruit,realistic,photography").
              - Do NOT use spaces in the image URL. Use commas or plus signs.
              - ALWAYS write a short text explanation first, and then include the image.` 
            }
        ];

        chatHistory.forEach(msg => messages.push(msg));
        messages.push({ role: 'user', content: userMessage });

        const groqResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'openai/gpt-oss-120b', 
                messages: messages
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const replyText = groqResponse.data.choices[0].message.content;

        chatHistory.push({ role: 'user', content: userMessage });
        chatHistory.push({ role: 'assistant', content: replyText });

        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(chatHistory.length - 10);
        }

        res.json({ reply: replyText });

    } catch (error) {
        console.log("ERROR:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Something went wrong." });
    }
});

// ⚠️ THIS IS THE VERCEL EXPORT
module.exports = app;
