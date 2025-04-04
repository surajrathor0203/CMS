const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Changed to gemini-pro

router.post('/generate-test', async (req, res) => {
  try {
    const { formData } = req.body;
    if (!formData) {
      throw new Error('No form data provided');
    }

    // Create a prompt without sections
    const prompt = `Generate a test paper with the following specifications:
    - Class: ${formData.class}
    - Subject: ${formData.subject}
    - Topic: ${formData.topic}
    - Difficulty: ${formData.difficultyLevel}
    - Number of Questions: ${formData.numberOfQuestions}
    
    ${formData.note ? `Additional notes: ${formData.note}` : ''}
    
    Generate MCQ questions with the following format:
    {
      "questions": [
        {
          "text": "Question text here",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 0  // Index of correct option
        }
      ]
    }
    
    Make sure each question:
    1. Is clear and concise
    2. Has exactly 4 options
    3. Has one correct answer
    4. Is appropriate for the specified class level and difficulty
    5. Matches the given topic
    
    Return the response in valid JSON format only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let jsonResponse;
    try {
      // Clean the response text and ensure it's valid JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      jsonResponse = JSON.parse(cleanedText);
      
      // Validate the structure
      if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions)) {
        throw new Error('Invalid response structure from AI');
      }
      
      // Ensure each question has the required format
      jsonResponse.questions = jsonResponse.questions.map(q => ({
        text: q.text || q.question || '',
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['', '', '', ''],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0
      }));

    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Failed to parse AI response into valid JSON');
    }
    
    res.json({ 
      success: true, 
      data: {
        questions: jsonResponse.questions
      }
    });
  } catch (error) {
    console.error('AI Test Generation Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error generating test paper'
    });
  }
});

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
