const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Generate content using Gemini AI
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    
    res.json({ success: true, message: text });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ success: false, message: 'Error processing your request' });
  }
});

module.exports = router;
