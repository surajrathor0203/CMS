const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, teacherOnly } = require('../middleware/authMiddleware');
const { uploadBook, getBooks, deleteBook, getBookAccessUrl } = require('../controllers/libraryController');
const Library = require('../models/Library'); // Add this line

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const multiUpload = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

// Update the /all route handler
router.get('/all', protect, async (req, res) => {
  try {
    // Add proper error handling and pagination if needed
    const books = await Library.find()
      .populate('teacher', 'name email') // Optionally populate teacher details
      .sort({ createdAt: -1 });

    const booksWithUrls = books.map(book => ({
      ...book.toObject(),
      coverImageUrl: book.coverImageUrl,
      fileUrl: book.fileUrl
    }));

    res.status(200).json({
      success: true,
      data: booksWithUrls
    });
  } catch (error) {
    console.error('Error fetching all books:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching books',
      error: error.message
    });
  }
});

router.post('/upload', protect, teacherOnly, multiUpload, uploadBook);
router.get('/', protect, teacherOnly, getBooks);
router.delete('/:id', protect, teacherOnly, deleteBook);
router.get('/:bookId/access', protect, getBookAccessUrl);

module.exports = router;
