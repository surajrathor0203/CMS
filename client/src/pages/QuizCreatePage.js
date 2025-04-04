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
  Tabs,
  Tab,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TeacherLayout from '../components/TeacherLayout';
import { createQuiz, generateTest } from '../services/api';
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

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiFormData, setAiFormData] = useState({
    class: '',
    subject: '',
    topic: '',
    difficultyLevel: 'medium',
    numberOfQuestions: '',
    note: ''
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleQuizDataChange = (field) => (event) => {
    setQuizData({ ...quizData, [field]: event.target.value });
  };

  const handleAiFormChange = (field) => (event) => {
    setAiFormData({ ...aiFormData, [field]: event.target.value });
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

  const generateQuestions = async () => {
    try {
      setLoading(true);
      const result = await generateTest({ ...aiFormData });
      
      if (result.success && result.data?.questions) {
        const formattedQuestions = result.data.questions.map(q => ({
          question: q.text,
          options: q.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: q.correctAnswer || 0
        }));

        setQuizData({
          ...quizData,
          questions: formattedQuestions
        });
        
        setActiveTab(0);
        toast.success('Questions generated successfully!');
      }
    } catch (error) {
      toast.error('Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!quizData.title || !quizData.duration || !quizData.startTime) {
        toast.error('Please fill all required fields');
        return;
      }

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

              <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="Add Questions Manually" />
                <Tab label="Generate from AI" />
              </Tabs>

              {activeTab === 0 ? (
                <Box>
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
              ) : (
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Class"
                        value={aiFormData.class}
                        onChange={handleAiFormChange('class')}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Subject"
                        value={aiFormData.subject}
                        onChange={handleAiFormChange('subject')}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Topic"
                        value={aiFormData.topic}
                        onChange={handleAiFormChange('topic')}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Difficulty Level"
                        value={aiFormData.difficultyLevel}
                        onChange={handleAiFormChange('difficultyLevel')}
                        required
                      >
                        <MenuItem value="easy">Easy</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="hard">Hard</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Number of Questions"
                        value={aiFormData.numberOfQuestions}
                        onChange={handleAiFormChange('numberOfQuestions')}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Additional Notes (Optional)"
                        value={aiFormData.note}
                        onChange={handleAiFormChange('note')}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={generateQuestions}
                        disabled={loading}
                        sx={{ mt: 2 }}
                      >
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          'Generate Questions'
                        )}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
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
