const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const checkInstallments = require('./utils/installmentChecker');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
    credentials: true
}));

// Import and register models before routes
require('./models/User');
require('./models/Assignment');
require('./models/Batch');
require('./models/Quiz'); // Add this line

// Import routes
const authRoutes = require('./routes/authRoutes');
const batchRoutes = require('./routes/batchRoutes');
const studentRoutes = require('./routes/studentRoutes');
const noteRoutes = require('./routes/noteRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');  // Add this line
const quizRoutes = require('./routes/quizRoutes');  // Add this line
const libraryRoutes = require('./routes/libraryRoutes');  // Add this line
const aiRoutes = require('./routes/aiRoutes');  // Add this line

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/assignments', assignmentRoutes);  // Add this line
app.use('/api/quizzes', quizRoutes);  // Add this line
app.use('/api/library', libraryRoutes);  // Add this line
app.use('/api/ai', aiRoutes);  // Add this line

// MongoDB connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        // Drop the name index if it exists
        try {
            await conn.connection.collection('batches').dropIndex('name_1');
        } catch (err) {
            // Index might not exist, ignore error
            console.log('No name index to drop or already dropped');
        }
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Schedule installment check to run daily at 3:57 PM
const scheduleInstallmentCheck = () => {
  const now = new Date();
  const scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    18, // 24-hour format: 15 = 3 PM
    16, // Minutes
    0  // Seconds
  );

  // If today's scheduled time has passed, schedule for tomorrow
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const msToScheduledTime = scheduledTime.getTime() - now.getTime();
  console.log(`Installment check scheduled for: ${scheduledTime.toLocaleString()}`);

  // First run at next 3:57 PM
  setTimeout(() => {
    console.log('Running installment check...');
    checkInstallments();
    // Then run every 24 hours
    setInterval(() => {
      console.log('Running daily installment check...');
      checkInstallments();
    }, 24 * 60 * 60 * 1000);
  }, msToScheduledTime);
};

// Connect to database and start the scheduler
connectDB().then(() => {
  scheduleInstallmentCheck();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to CMS API' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 8080;
