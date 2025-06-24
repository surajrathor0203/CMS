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

    const prompt = `Generate a test paper with the following specifications:
    - Class: ${formData.class}
    - Subject: ${formData.subject}
    - Topic: ${formData.topic}
    - Difficulty: ${formData.difficultyLevel}
    - Duration: ${formData.duration} hours
    - Exam Date: ${formData.examDate}
    
    For each section:
    ${formData.sections.map((section, index) => 
      `Section ${index + 1}: ${section.questions} questions, ${section.marksPerQuestion} marks each`
    ).join('\n')}
    
    ${formData.note ? `Additional notes: ${formData.note}` : ''}
    
    Provide the response in valid JSON format with this exact structure:
    {
      "questions": {
        "section1": [
          {
            "questionNumber": 1,
            "text": "Write the question here",
            "marks": 5,
            "type": "descriptive/mcq",
            "options": ["option1", "option2"] // only for MCQs
          }
        ]
      },
      "answers": {
        "section1": [
          {
            "questionNumber": 1,
            "answer": "The answer",
            "solution": "Step by step solution"
          }
        ]
      }
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let jsonResponse;
    try {
      // Clean the response text and ensure it's valid JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      jsonResponse = JSON.parse(cleanedText);
      
      // Validate the structure
      if (!jsonResponse.questions || !jsonResponse.answers) {
        throw new Error('Invalid response structure from AI');
      }
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Failed to parse AI response into valid JSON');
    }
    
    res.json({ 
      success: true, 
      data: jsonResponse
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