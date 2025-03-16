import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TeacherLayout from '../components/TeacherLayout';
import { createQuiz } from '../services/api';
import { toast } from 'react-toastify';

const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9',
};

export default function QuizCreatePage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    duration: '',
    startTime: '',
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
  });

  const handleQuizDataChange = (field) => (event) => {
    setQuizData({ ...quizData, [field]: event.target.value });
  };

  const handleAddQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [...quizData.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
    });
  };

  const handleDeleteQuestion = (index) => {
    const newQuestions = quizData.questions.filter((_, i) => i !== index);
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleQuestionChange = (index, field, value, optionIndex = null) => {
    const newQuestions = [...quizData.questions];
    if (optionIndex !== null) {
      newQuestions[index].options[optionIndex] = value;
    } else if (field === 'correctAnswer') {
      newQuestions[index].correctAnswer = parseInt(value);
    } else {
      newQuestions[index][field] = value;
    }
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      if (!quizData.title || !quizData.duration || !quizData.startTime) {
        toast.error('Please fill all required fields');
        return;
      }

      // Validate questions
      const isQuestionsValid = quizData.questions.every(q => 
        q.question && 
        q.options.every(opt => opt.trim() !== '') &&
        q.correctAnswer !== null
      );

      if (!isQuestionsValid) {
        toast.error('Please complete all questions and options');
        return;
      }

      await createQuiz(quizData, batchId);
      toast.success('Quiz created successfully');
      navigate(`/teacher-dashboard/batch/${batchId}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create quiz');
    }
  };

  return (
    <TeacherLayout title='Create Quiz'>
      <Box sx={{ p: 3 }}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom color={theme.primary}>
              Create New Quiz
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quiz Title"
                  value={quizData.title}
                  onChange={handleQuizDataChange('title')}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={quizData.duration}
                  onChange={handleQuizDataChange('duration')}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={quizData.description}
                  onChange={handleQuizDataChange('description')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="datetime-local"
                  value={quizData.startTime}
                  onChange={handleQuizDataChange('startTime')}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom color={theme.primary}>
                Questions
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {quizData.questions.map((question, qIndex) => (
                <Paper key={qIndex} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Question {qIndex + 1}
                    </Typography>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteQuestion(qIndex)}
                      disabled={quizData.questions.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="Question"
                    value={question.question}
                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                    sx={{ mb: 2 }}
                    required
                  />

                  <Grid container spacing={2}>
                    {question.options.map((option, oIndex) => (
                      <Grid item xs={12} sm={6} key={oIndex}>
                        <TextField
                          fullWidth
                          label={`Option ${oIndex + 1}`}
                          value={option}
                          onChange={(e) => handleQuestionChange(qIndex, 'options', e.target.value, oIndex)}
                          required
                        />
                      </Grid>
                    ))}
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="Correct Answer"
                        value={question.correctAnswer}
                        onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                        SelectProps={{ native: true }}
                        required
                      >
                        {question.options.map((_, index) => (
                          <option key={index} value={index}>
                            Option {index + 1}
                          </option>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddQuestion}
                sx={{ mt: 2 }}
              >
                Add Question
              </Button>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/teacher-dashboard/batch/${batchId}`)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                sx={{ bgcolor: theme.primary }}
                onClick={handleSubmit}
              >
                Create Quiz
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </TeacherLayout>
  );
}
