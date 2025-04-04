const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { protect } = require('../middleware/authMiddleware');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/generate', protect, async (req, res) => {
  try {
    const { class: className, subject, topic, difficultyLevel, numberOfQuestions, note } = req.body;

    // Construct the prompt
    const prompt = `Generate ${numberOfQuestions} multiple choice questions for ${subject} class ${className} on the topic "${topic}" with ${difficultyLevel} difficulty level.
    ${note ? `Additional context: ${note}` : ''}
    
    Return a valid JSON array of questions. Each question should be in this exact format:
    {
      "question": "The question text here",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correctAnswer": 0
    }
    
    Requirements:
    1. Each question must be clear and concise
    2. Each question must have exactly 4 options
    3. correctAnswer must be a number 0-3 indicating the index of the correct option
    4. Questions must be appropriate for ${className} class level
    5. Questions must be related to ${topic}
    6. Difficulty should be ${difficultyLevel}
    
    Important: Return ONLY the JSON array. Do not include any markdown formatting, explanation, or additional text.`;

    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response
    // Remove any markdown code block indicators
    text = text.replace(/```json\s*/g, '');
    text = text.replace(/```\s*/g, '');
    
    // Remove any leading/trailing whitespace
    text = text.trim();

    // Ensure the text starts with [ and ends with ]
    if (!text.startsWith('[')) {
      text = '[' + text;
    }
    if (!text.endsWith(']')) {
      text = text + ']';
    }

    try {
      // Parse the JSON response
      const questions = JSON.parse(text);

      // Validate the questions format
      const isValidFormat = questions.every(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 &&
        typeof q.correctAnswer === 'number' &&
        q.correctAnswer >= 0 &&
        q.correctAnswer <= 3
      );

      if (!isValidFormat) {
        throw new Error('Invalid question format received from AI');
      }

      res.json({
        success: true,
        data: {
          questions
        }
      });
    } catch (parseError) {
      console.error('Parse error:', parseError);
      console.error('Raw text:', text);
      res.status(500).json({
        success: false,
        message: 'Error parsing AI response',
        error: parseError.message
      });
    }

  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating quiz questions',
      error: error.message
    });
  }
});

module.exports = router;
