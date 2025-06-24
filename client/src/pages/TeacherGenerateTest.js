import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  MenuItem,
  Grid,
  CircularProgress,
  Backdrop
} from '@mui/material';
import { Copy, Download, Edit, Save, RotateCcw } from 'lucide-react';
import TeacherLayout from '../components/TeacherLayout';
import { sendChatMessage, generateTest } from '../services/api';
import html2pdf from 'html2pdf.js';
import { getUserFromCookie } from '../utils/cookies';  // Add this import

export default function TeacherGenerateTest() {
  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    topic: '',
    difficultyLevel: '',
    duration: '',
    examDate: '', // Add exam date field
    sections: [{ questions: '', marksPerQuestion: '' }],
    note: ''
  });

  const [showChat, setShowChat] = useState(false);
  const [testData, setTestData] = useState(null);
  const [activeTab, setActiveTab] = useState('questions');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState({
    questions: null,
    answers: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const difficultyLevels = ['Easy', 'Medium', 'Hard'];

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSectionChange = (index, field, value) => {
    const newSections = [...formData.sections];
    newSections[index] = {
      ...newSections[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      sections: newSections
    }));
  };

  const handleAddSection = () => {
    setFormData(prevData => ({
      ...prevData,
      sections: [...prevData.sections, { questions: '', marksPerQuestion: '' }]
    }));
  };

  const handleRemoveSection = (indexToRemove) => {
    if (formData.sections.length > 1) {
      setFormData(prevData => ({
        ...prevData,
        sections: prevData.sections.filter((_, index) => index !== indexToRemove)
      }));
    }
  };

  const calculateTotalMarks = () => {
    return formData.sections.reduce((total, section) => {
      return total + (Number(section.questions) * Number(section.marksPerQuestion));
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await generateTest(formData);
      
      if (response.success && response.data) {
        const data = response.data;
        if (!data.questions || !data.answers) {
          throw new Error('Invalid response format from server');
        }
        setTestData(data);
        setShowChat(true);
      } else {
        throw new Error(response.message || 'Failed to generate test');
      }
    } catch (error) {
      console.error('Test generation error:', error);
      alert(error.message || 'Failed to generate test. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatQuestionPaper = () => {
    if (!testData || !testData.questions) return '';

    const userData = getUserFromCookie(); // Get user data from cookie
    const cochingName = userData?.user?.cochingName || 'COACHING';

    let content = `${cochingName.toUpperCase()}\n`;
    content += `${formData.subject.toUpperCase()}\n`;
    content += `Class: ${formData.class}\n`;
    content += `Date: ${new Date(formData.examDate).toLocaleDateString()}\n`; // Add exam date
    content += `Time: ${formData.duration} Hours\n`;
    content += `Maximum Marks: ${calculateTotalMarks()}\n\n`;

    const sections = testData.questions || {};
    Object.entries(sections).forEach(([sectionKey, questions]) => {
      if (!Array.isArray(questions)) return;

      content += `${sectionKey.toUpperCase()}\n\n`;
      questions.forEach(q => {
        if (!q) return;
        content += `${q.questionNumber || ''}. ${q.text || ''} [${q.marks || 0} marks]\n`;
        if (Array.isArray(q.options)) {
          q.options.forEach((opt, index) => {
            content += `   ${String.fromCharCode(97 + index)}) ${opt}\n`;
          });
        }
        content += '\n';
      });
    });

    return content;
  };

  const formatAnswerKey = () => {
    if (!testData || !testData.answers) return '';

    let content = `ANSWER KEY\n\n`;
    content += `${formData.subject} - ${formData.topic}\n\n`;

    const sections = testData.answers || {};
    Object.entries(sections).forEach(([sectionKey, answers]) => {
      if (!Array.isArray(answers)) return;

      content += `${sectionKey.toUpperCase()}\n\n`;
      answers.forEach(a => {
        if (!a) return;
        content += `${a.questionNumber || ''}. Answer: ${a.answer || ''}\n`;
        if (a.solution) {
          content += `   Solution: ${a.solution}\n`;
        }
        content += '\n';
      });
    });

    return content;
  };

  const handleDownload = () => {
    if (!testData) {
      alert('No test data available to download');
      return;
    }
    
    const content = activeTab === 'questions' ? formatQuestionPaper() : formatAnswerKey();
    const fileName = `${formData.subject}_${formData.topic}_${activeTab}.pdf`;
    const currentDate = new Date().toLocaleDateString();
    
    const userData = getUserFromCookie(); // Get user data from cookie
    const coachingName = userData?.user?.cochingName || 'COACHING';
    
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 20px; font-family: 'Times New Roman', serif; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px;">${coachingName.toUpperCase()}</h2>
          <h3 style="margin: 5px 0; font-size: 20px;">${formData.subject.toUpperCase()}</h3>
          <p style="margin: 5px 0; font-size: 16px;">${activeTab === 'questions' ? 'Question Paper' : 'Answer Key'}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #000; width: 50%;">
              <strong>Class:</strong> ${formData.class}
            </td>
            <td style="padding: 8px; border: 1px solid #000;">
              <strong>Date:</strong> ${new Date(formData.examDate).toLocaleDateString()}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #000;">
              <strong>Subject:</strong> ${formData.subject}
            </td>
            <td style="padding: 8px; border: 1px solid #000;">
              <strong>Duration:</strong> ${formData.duration} Hours
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #000;">
              <strong>Topic:</strong> ${formData.topic}
            </td>
            <td style="padding: 8px; border: 1px solid #000;">
              <strong>Maximum Marks:</strong> ${calculateTotalMarks()}
            </td>
          </tr>
        </table>
        ${activeTab === 'questions' ? `
          <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #000;">
            <strong>General Instructions:</strong>
            <ol style="margin: 5px 0 0 20px; padding-left: 0;">
              <li>All questions are compulsory.</li>
              <li>Write your answers in clear and legible handwriting.</li>
              <li>Read each question carefully before answering.</li>
              <li>Marks for each question are indicated against it.</li>
            </ol>
          </div>
        ` : ''}
        <div style="font-size: 14px; text-align: justify;">
          ${activeTab === 'questions' ? 
            Object.entries(testData.questions).map(([sectionKey, questions]) => `
              <div style="margin-bottom: 20px;">
                <h3 style="margin: 15px 0; text-decoration: underline;">${sectionKey.toUpperCase()}</h3>
                ${questions.map(q => `
                  <div style="margin-bottom: 15px;">
                    <p style="margin: 5px 0;">
                      <strong>${q.questionNumber}.</strong> ${q.text} 
                      <span style="float: right;">[${q.marks} marks]</span>
                    </p>
                    ${q.options ? `
                      <div style="margin-left: 20px;">
                        ${q.options.map((opt, index) => `
                          <p style="margin: 5px 0;">
                            ${String.fromCharCode(97 + index)}) ${opt}
                          </p>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `).join('') 
            : 
            Object.entries(testData.answers).map(([sectionKey, answers]) => `
              <div style="margin-bottom: 20px;">
                <h3 style="margin: 15px 0; text-decoration: underline;">${sectionKey.toUpperCase()} - ANSWERS</h3>
                ${answers.map(a => `
                  <div style="margin-bottom: 15px;">
                    <p style="margin: 5px 0;">
                      <strong>${a.questionNumber}.</strong> Answer: ${a.answer}
                    </p>
                    ${a.solution ? `
                      <p style="margin: 5px 0 5px 20px;">
                        <strong>Solution:</strong> ${a.solution}
                      </p>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `).join('')}
        </div>
        <div style="margin-top: 30px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">End of ${activeTab === 'questions' ? 'Question Paper' : 'Answer Key'}</p>
          <p style="margin: 5px 0;">Generated on ${currentDate}</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 0.5,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait',
        fontSize: 12,
        lineHeight: 1.6
      },
      pagebreak: { mode: 'css' }
    };

    html2pdf().from(element).set(opt).save();
  };

  const handleEditContent = () => {
    if (!isEditing) {
      setEditedContent({
        questions: JSON.parse(JSON.stringify(testData.questions)),
        answers: JSON.parse(JSON.stringify(testData.answers))
      });
    } else {
      setTestData({
        questions: editedContent.questions,
        answers: editedContent.answers
      });
    }
    setIsEditing(!isEditing);
  };

  const handleQuestionEdit = (sectionKey, questionIndex, field, value) => {
    setEditedContent(prev => {
      const newQuestions = { ...prev.questions };
      newQuestions[sectionKey][questionIndex][field] = value;
      return { ...prev, questions: newQuestions };
    });
  };

  const handleAnswerEdit = (sectionKey, answerIndex, field, value) => {
    setEditedContent(prev => {
      const newAnswers = { ...prev.answers };
      newAnswers[sectionKey][answerIndex][field] = value;
      return { ...prev, answers: newAnswers };
    });
  };

  const renderEditableContent = () => {
    const content = activeTab === 'questions' ? editedContent.questions : editedContent.answers;
    
    return Object.entries(content).map(([sectionKey, items]) => (
      <div key={sectionKey} style={{ marginBottom: '20px' }}>
        <Typography variant="h6" gutterBottom>
          {sectionKey.toUpperCase()}
        </Typography>
        
        {items.map((item, index) => (
          <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            {activeTab === 'questions' ? (
              <>
                <TextField
                  fullWidth
                  label="Question"
                  value={item.text}
                  onChange={(e) => handleQuestionEdit(sectionKey, index, 'text', e.target.value)}
                  multiline
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Marks"
                  type="number"
                  value={item.marks}
                  onChange={(e) => handleQuestionEdit(sectionKey, index, 'marks', e.target.value)}
                  sx={{ width: '100px', mr: 2 }}
                />
                {item.type === 'mcq' && (
                  <Box sx={{ mt: 2 }}>
                    {item.options.map((option, optIndex) => (
                      <TextField
                        key={optIndex}
                        fullWidth
                        label={`Option ${String.fromCharCode(97 + optIndex)}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...item.options];
                          newOptions[optIndex] = e.target.value;
                          handleQuestionEdit(sectionKey, index, 'options', newOptions);
                        }}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Answer"
                  value={item.answer}
                  onChange={(e) => handleAnswerEdit(sectionKey, index, 'answer', e.target.value)}
                  multiline
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Solution"
                  value={item.solution}
                  onChange={(e) => handleAnswerEdit(sectionKey, index, 'solution', e.target.value)}
                  multiline
                />
              </>
            )}
          </Box>
        ))}
      </div>
    ));
  };

  if (isLoading) {
    return (
      <TeacherLayout>
        <Backdrop
          sx={{ 
            color: '#fff', 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            flexDirection: 'column',
            gap: 2
          }}
          open={true}
        >
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" component="div">
            Generating Test Paper...
          </Typography>
          <Typography variant="body1" color="inherit">
            This may take a few moments
          </Typography>
        </Backdrop>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title={"Generate Test"}>
      <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', p: 3 }}>
        {!showChat ? (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Generation Parameters
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Class"
                    name="class"
                    value={formData.class}
                    onChange={handleFormChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleFormChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleFormChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    select
                    label="Difficulty Level"
                    name="difficultyLevel"
                    value={formData.difficultyLevel}
                    onChange={handleFormChange}
                    required
                  >
                    {difficultyLevels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Duration (Hours)"
                    name="duration"
                    value={formData.duration}
                    onChange={handleFormChange}
                    required
                    InputProps={{ 
                      inputProps: { 
                        min: 0.5,
                        max: 24,
                        step: 0.5
                      } 
                    }}
                  />
                </Grid>
                {/* Add exam date field after class/subject/topic */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Exam Date"
                    name="examDate"
                    type="date"
                    value={formData.examDate}
                    onChange={handleFormChange}
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                {formData.sections.map((section, index) => (
                  <Grid item xs={12} key={index}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 2,
                      gap: 2 
                    }}>
                      <Typography variant="subtitle1">
                        Section {index + 1}
                      </Typography>
                      {formData.sections.length > 1 && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRemoveSection(index)}
                          variant="outlined"
                        >
                          Remove Section
                        </Button>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Number of Questions"
                          value={section.questions}
                          onChange={(e) => handleSectionChange(index, 'questions', e.target.value)}
                          required
                          InputProps={{ inputProps: { min: 1 } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Marks per Question"
                          value={section.marksPerQuestion}
                          onChange={(e) => handleSectionChange(index, 'marksPerQuestion', e.target.value)}
                          required
                          InputProps={{ inputProps: { min: 1 } }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                ))}

                <Grid item xs={12}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleAddSection}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Add New Section
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Additional Notes (Optional)"
                    name="note"
                    value={formData.note}
                    onChange={handleFormChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    Generate Test
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Button
                variant={activeTab === 'questions' ? 'contained' : 'outlined'}
                onClick={() => setActiveTab('questions')}
              >
                Question Paper
              </Button>
              <Button
                variant={activeTab === 'answers' ? 'contained' : 'outlined'}
                onClick={() => setActiveTab('answers')}
              >
                Answer Key
              </Button>
              <Button
                variant="outlined"
                startIcon={isEditing ? <Save /> : <Edit />}
                onClick={handleEditContent}
              >
                {isEditing ? 'Save Changes' : 'Edit'}
              </Button>
              {isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<RotateCcw />}
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(null);
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownload}
                disabled={isEditing}
              >
                Download PDF
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowChat(false)}
                disabled={isEditing}
              >
                Generate Another Test
              </Button>
            </Box>

            <Paper 
              elevation={1}
              sx={{
                p: 3,
                flex: 1,
                backgroundColor: '#fff',
                fontFamily: 'serif',
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
                fontSize: '14px',
                lineHeight: 1.6
              }}
            >
              {isEditing ? (
                renderEditableContent()
              ) : (
                activeTab === 'questions' ? formatQuestionPaper() : formatAnswerKey()
              )}
            </Paper>
          </Paper>
        )}
      </Box>
    </TeacherLayout>
  );
}
