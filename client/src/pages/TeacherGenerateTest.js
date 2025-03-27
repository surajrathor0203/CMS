import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  MenuItem,
  Grid,
} from '@mui/material';
import { Copy, Download, Edit } from 'lucide-react';
import TeacherLayout from '../components/TeacherLayout';
import { sendChatMessage } from '../services/api';
import html2pdf from 'html2pdf.js';

export default function TeacherGenerateTest() {
  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    topic: '',
    difficultyLevel: '',
    duration: '',  // Add duration field
    sections: [{ questions: '', marksPerQuestion: '' }],
    note: ''
  });

  const [showChat, setShowChat] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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

  const generatePrompt = () => {
    const sectionsInfo = formData.sections
      .map((section, index) => 
        `Section ${index + 1}: ${section.questions} questions of ${section.marksPerQuestion} marks each`
      )
      .join(', ');

    const prompt = `Generate a ${formData.difficultyLevel} level test paper for Class ${formData.class} 
      on the topic "${formData.topic}" in ${formData.subject}. The test should have ${formData.sections.length} sections: 
      ${sectionsInfo}. ${formData.note ? `Additional note: ${formData.note}` : ''}
      Please include detailed solutions for each question. i dont want start in new line.`;

    setShowChat(true);
    return prompt;
  };

  const handleAIResponse = (response) => {
    setEditableContent(response.trim());
  };

  const calculateTotalMarks = () => {
    return formData.sections.reduce((total, section) => {
      return total + (Number(section.questions) * Number(section.marksPerQuestion));
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const prompt = generatePrompt();
      const response = await sendChatMessage(prompt);
      if (response.success) {
        handleAIResponse(response.message);
        setShowChat(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      alert('Sorry, I encountered an error. Please try again.');
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(editableContent);
  };

  const handleDownload = () => {
    const questions = editableContent.trim();

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 20px; font-family: 'Times New Roman', serif; line-height: 1.6;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0; text-transform: uppercase;">${formData.subject}</h2>
          <p style="margin: 5px 0; font-size: 16px;"><strong>Class:</strong> ${formData.class}</p>
          <p style="margin: 5px 0; font-size: 16px;"><strong>Topic:</strong> ${formData.topic}</p>
          <div style="margin: 15px 0; display: flex; justify-content: space-between; font-size: 16px;">
            <strong>Time: ${formData.duration} Hours</strong>
            <strong>Maximum Marks: ${calculateTotalMarks()}</strong>
          </div>
          <div style="border-bottom: 2px solid black; margin: 20px 0;"></div>
        </div>

        <!-- Questions Section -->
        <div style="margin-bottom: 30px;">
          ${questions.split('\n').map(line => {
            // Section headers
            if (line.trim().startsWith('Section')) {
              return `<h3 style="margin: 25px 0 10px 0; text-decoration: underline;">${line}</h3>`;
            }
            // MCQ options (starting with a, b, c, d, etc.)
            if (line.trim().match(/^[a-z]\)/i)) {
              return `<p style="margin: 8px 0 8px 20px;">${line}</p>`;
            }
            // Numbered questions
            if (line.trim().match(/^\d+\./)) {
              return `<p style="margin: 16px 0 12px 0; page-break-inside: avoid;">${line}</p>`;
            }
            return `<p style="margin: 10px 0;">${line}</p>`;
          }).join('')}
        </div>
      </div>
    `;

    const opt = {
      margin: 0.5,
      filename: `${formData.subject}_${formData.topic}_test.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait',
        putOnlyUsedFonts: true
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().from(element).set(opt).save();
  };

  return (
    <TeacherLayout>
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
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Save' : 'Edit'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Copy />}
                onClick={handleCopyContent}
              >
                Copy
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownload}
              >
                Download PDF
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowChat(false)}
              >
                Generate Another Test
              </Button>
            </Box>

            {isEditing ? (
              <TextField
                multiline
                fullWidth
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                variant="outlined"
                sx={{
                  flex: 1,
                  '& .MuiInputBase-root': {
                    height: '100%',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    display: 'flex',
                  },
                  '& .MuiInputBase-input': {
                    flex: 1,
                    overflow: 'auto !important',
                    maxHeight: 'none !important',
                    height: '100% !important',
                  }
                }}
              />
            ) : (
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
                  lineHeight: 1.6,
                  '& h1, h2, h3': {
                    marginBottom: '16px',
                  }
                }}
              >
                {editableContent}
              </Paper>
            )}
          </Paper>
        )}
      </Box>
    </TeacherLayout>
  );
}
