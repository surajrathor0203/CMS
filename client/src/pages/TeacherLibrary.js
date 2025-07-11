import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Upload, Trash2, FileText, Search } from 'lucide-react';
import { uploadBook, getBooks, getAllBooks, deleteBook, getBookAccessUrl } from '../services/api';
import { getUserFromCookie } from '../utils/cookies';
import TeacherLayout from '../components/TeacherLayout';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';

const theme = {
    primary: '#2e7d32', // dark green
    light: '#81c784',   // light green
    background: '#e8f5e9' // very light green background
  };

const BookCard = ({ book, onDelete, onOpen }) => {
  return (
    <Card 
      elevation={1}
      sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        overflow: 'hidden',
        borderRadius: 2,
        width: '100%',
        maxHeight: { xs: 'none', sm: '200px' }, // Remove max height on mobile
        position: 'relative' // Add this to make absolute positioning work
      }}
    >
      {/* Only show delete button if onDelete is provided */}
      {onDelete && (
        <IconButton 
          onClick={() => onDelete(book._id)} 
          color="error"
          sx={{ 
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1, // Ensure button stays above other content
            bgcolor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.9)',
            }
          }}
        >
          <Trash2 size={20} />
        </IconButton>
      )}

      {/* Book Cover Section */}
      <Box 
        sx={{ 
          width: { xs: '100%', sm: 140 },
          height: { xs: '180px', sm: '200px' },
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 1
        }}
      >
        <img 
          src={book.coverImageUrl || book.pdfCoverUrl}
          alt={book.title}
          style={{ 
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-book.png';
          }}
        />
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: { xs: '100%', sm: 'calc(100% - 140px)' },
        p: 2,
        position: 'relative'
      }}>
        <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">
          {book.title}
        </Typography>

        {/* Modified to show author and uploader in same row */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            Author: {book.authorName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            •
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Uploaded by: {book.teacherName || 'Unknown Teacher'}
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          mb: 0.5,
          gap: { xs: 1, sm: 2 },
          width: '100%'
        }}>
          {/* Subject */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Typography variant="body2" color="text.secondary" mr={1}>
              Subject:
            </Typography>
            <Chip 
              label={book.subject} 
              size="small" 
              variant="outlined" 
              sx={{ borderRadius: 1 }}
            />
          </Box>

          {/* Tags - Modified to show all tags */}
          {book.authorTags?.length > 0 && (
            <Stack 
              direction="row" 
              spacing={0.5} 
              sx={{ 
                flexWrap: 'wrap', 
                gap: 0.5,
                ml: { xs: 0, sm: 'auto' },
                width: { xs: '100%', sm: 'auto' },
                mt: { xs: 0, sm: 0 }
              }}
            >
              {book.authorTags.map((tag, index) => (
                <Chip 
                  key={index} 
                  label={tag} 
                  size="small"
                  sx={{ height: 24 }}
                />
              ))}
            </Stack>
          )}
        </Box>

        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: { xs: 4, sm: 3 }, // Show more lines on mobile
            WebkitBoxOrient: 'vertical',
            mt: 1
          }}
        >
          {book.description || "No description available."}
        </Typography>
        
       
        
        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<FileText size={16} />}
              onClick={() => onOpen(book._id)}
              sx={{ 
                borderRadius: 1,
                bgcolor: theme.primary,
                '&:hover': {
                  bgcolor: 'rgba(76, 175, 80, 0.8)',
                }
              }}
            >
              Read Book
            </Button>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default function TeacherLibrary() {
  const [allBooks, setAllBooks] = useState([]); // Add this state
  const [myBooks, setMyBooks] = useState([]); // Rename books to myBooks
  const [openUpload, setOpenUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    authorName: '',
    subject: '',
    authorTags: [],
    coverImage: null,
    file: null
  });
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // Add this state
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);

  const userData = getUserFromCookie();
  const teacherId = userData?.user?.id;

  const fetchAllBooks = async () => {
    try {
      const response = await getAllBooks();
      setAllBooks(response.data);
    } catch (error) {
      toast.error('Failed to fetch all books');
    }
  };

  const fetchMyBooks = async () => {
    try {
      const response = await getBooks(teacherId);
      setMyBooks(response.data);
    } catch (error) {
      toast.error('Failed to fetch your books');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchAllBooks();
      await fetchMyBooks();
      setLoading(false);
    };
    fetchData();
  }, [teacherId]);

  const handleUpload = async () => {
    try {
      if (!uploadData.file || !uploadData.title) {
        toast.error('Please fill in all required fields');
        return;
      }

      setUploadLoading(true);

      // Add teacher name to upload data
      const uploadDataWithTeacher = {
        ...uploadData,
        teacherName: userData?.user?.name || 'Unknown Teacher'
      };

      const response = await uploadBook(uploadDataWithTeacher);
      if (response.success) {
        toast.success('Book uploaded successfully');
        setOpenUpload(false);
        fetchMyBooks();
        setUploadData({
          title: '',
          description: '',
          authorName: '',
          subject: '',
          authorTags: [],
          coverImage: null,
          file: null
        });
      } else {
        toast.error(response.message || 'Failed to upload book');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload book');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (bookId) => {
    try {
      await deleteBook(bookId);
      toast.success('Book deleted successfully');
      fetchMyBooks();
    } catch (error) {
      toast.error('Failed to delete book');
    }
  };

  const handleAddTag = (event) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      setUploadData({
        ...uploadData,
        authorTags: [...uploadData.authorTags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setUploadData({
      ...uploadData,
      authorTags: uploadData.authorTags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleOpenBook = async (bookId) => {
    try {
      const response = await getBookAccessUrl(bookId);
      if (response.success && response.data.url) {
        window.open(response.data.url, '_blank');
      } else {
        toast.error('Failed to access book');
      }
    } catch (error) {
      toast.error('Error accessing book');
    }
  };

  const filteredBooks = (activeTab === 'all' ? allBooks : myBooks).filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) // Add search by teacher name
  );

  return (
    <TeacherLayout title="Library">
      {loading ? (
        <Loading message="Loading library..." />
      ) : (
        <Box>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setOpenUpload(true)}
              sx={{
                bgcolor: theme.primary,
                '&:hover': {
                  bgcolor: theme.light,
                }
              }}
              disabled={uploadLoading}
            >
              Upload Book
            </Button>
          </Box>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search books by title, author, subject or uploader..." // Updated placeholder
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
            }}
            sx={{ 
              mb: 4,
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: theme.primary,
                },
              },
            }}
          />

          {/* Add Tab Selection */}
          <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
            <Button
              variant={activeTab === 'all' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('all')}
              sx={{
                bgcolor: activeTab === 'all' ? theme.primary : 'transparent',
                '&:hover': {
                  bgcolor: activeTab === 'all' ? theme.light : 'rgba(46, 125, 50, 0.1)',
                }
              }}
            >
              All Books
            </Button>
            <Button
              variant={activeTab === 'my-uploads' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('my-uploads')}
              sx={{
                bgcolor: activeTab === 'my-uploads' ? theme.primary : 'transparent',
                '&:hover': {
                  bgcolor: activeTab === 'my-uploads' ? theme.light : 'rgba(46, 125, 50, 0.1)',
                }
              }}
            >
              My Uploads
            </Button>
          </Box>

          <Typography variant="h6" sx={{ mb: 2 }}>
            {activeTab === 'all' ? 'All Books' : 'My Uploads'}
          </Typography>

          <Grid container spacing={3}>
            {filteredBooks.map((book) => (
              <Grid item xs={12} key={book._id}>
                <BookCard 
                  book={book} 
                  onDelete={activeTab === 'my-uploads' ? handleDelete : null}
                  onOpen={handleOpenBook}
                />
              </Grid>
            ))}
            {filteredBooks.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    {activeTab === 'my-uploads' 
                      ? "You haven't uploaded any books yet."
                      : "No books found. Adjust your search or try different filters."}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: theme.background }}>Upload New Book</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                required
                label="Book Title"
                margin="normal"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                disabled={uploadLoading}
              />
              <TextField
                fullWidth
                required
                label="Author Name"
                margin="normal"
                value={uploadData.authorName}
                onChange={(e) => setUploadData({ ...uploadData, authorName: e.target.value })}
                disabled={uploadLoading}
              />
              
              {/* Subject and Tags in same row with better alignment */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mt: 2,
                alignItems: 'flex-start' // Align items at the top
              }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    required
                    label="Subject"
                    size="small"
                    value={uploadData.subject}
                    onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })}
                    disabled={uploadLoading}
                  />
                </Box>
                <Box sx={{ flex: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tags (Press Enter to add)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleAddTag}
                    disabled={uploadLoading}
                  />
                  <Stack 
                    direction="row" 
                    spacing={0.5} 
                    sx={{ 
                      mt: 0.5,
                      flexWrap: 'wrap',
                      gap: 0.5,
                      minHeight: 32
                    }}
                  >
                    {uploadData.authorTags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        color="primary"
                        variant="outlined"
                        size="small"
                        disabled={uploadLoading}
                      />
                    ))}
                  </Stack>
                </Box>
              </Box>

              {/* Description field */}
              <TextField
                fullWidth
                label="Book Description"
                margin="normal"
                multiline
                rows={4}
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                placeholder="Enter a detailed description of the book..."
                sx={{ mt: 3 }}
                disabled={uploadLoading}
              />

              <Divider sx={{ my: 2 }} />
              
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 2 }}
                disabled={uploadLoading}
              >
                Upload Cover Image (Optional)
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setUploadData({ ...uploadData, coverImage: e.target.files[0] })}
                />
              </Button>
              {uploadData.coverImage && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Cover image: {uploadData.coverImage.name}
                </Typography>
              )}
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 2 }}
                disabled={uploadLoading}
              >
                Upload PDF Book (Required)
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                />
              </Button>
              {uploadData.file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Book file: {uploadData.file.name}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenUpload(false)} disabled={uploadLoading}>Cancel</Button>
              <Button 
                onClick={handleUpload} 
                variant="contained"
                sx={{
                  bgcolor: theme.primary,
                  '&:hover': {
                    bgcolor: theme.light,
                  }
                }}
                disabled={uploadLoading}
              >
                {uploadLoading ? <CircularProgress size={24} /> : 'Upload'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </TeacherLayout>
  );
}