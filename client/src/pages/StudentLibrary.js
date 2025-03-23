import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  Button,
  Chip,
  Stack
} from '@mui/material';
import { Search, FileText } from 'lucide-react';
import { getAllBooks, getBookAccessUrl } from '../services/api';
import { getUserFromCookie } from '../utils/cookies';
import StudentLayout from '../components/StudentLayout';
import { toast } from 'react-toastify';

const theme = {
  primary: '#2e7d32',
  light: '#81c784',
  background: '#e8f5e9'
};

const BookCard = ({ book, onOpen }) => {
  return (
    <Card 
      elevation={1}
      sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        overflow: 'hidden',
        borderRadius: 2,
        width: '100%',
        maxHeight: { xs: 'none', sm: '200px' },
        position: 'relative'
      }}
    >
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

          {/* Tags */}
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
            WebkitLineClamp: { xs: 4, sm: 3 },
            WebkitBoxOrient: 'vertical',
            mt: 1
          }}
        >
          {book.description || "No description available."}
        </Typography>

        <Box sx={{ mt: 'auto' }}>
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
    </Card>
  );
};

export default function StudentLibrary() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await getAllBooks();
        setBooks(response.data);
      } catch (error) {
        toast.error('Failed to fetch books');
      }
    };
    fetchBooks();
  }, []);

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

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StudentLayout title="Library">
      <Box>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search books by title, author, subject or teacher..."
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

        <Grid container spacing={3}>
          {filteredBooks.map((book) => (
            <Grid item xs={12} key={book._id}>
              <BookCard 
                book={book} 
                onOpen={handleOpenBook}
              />
            </Grid>
          ))}
          {filteredBooks.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No books found. Try adjusting your search.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </StudentLayout>
  );
}
