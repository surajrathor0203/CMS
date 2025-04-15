const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const checkInstallments = require('./utils/installmentChecker');
const checkSubscriptions = require('./utils/subscriptionChecker'); // Add this line

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

// Add after middleware setup but before routes
app.use((req, res, next) => {
    req.setTimeout(30000); // 30 second timeout for requests
    res.setTimeout(30000);
    next();
});

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
const adminRoutes = require('./routes/adminRoutes');  // Add this line
const subscriptionRoutes = require('./routes/subscriptionRoutes'); // Add this line
const aiQuizRoutes = require('./routes/aiQuizRoutes');  // Add this line

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/assignments', assignmentRoutes);  // Add this line
app.use('/api/quizzes', quizRoutes);  // Add this line
app.use('/api/library', libraryRoutes);  // Add this line
app.use('/api/ai', aiRoutes);  // Add this line
app.use('/api/admin', adminRoutes);  // Add this line
app.use('/api/subscription', subscriptionRoutes); // Add this line
app.use('/api/ai-quiz', aiQuizRoutes);  // Add this line

// MongoDB connection
const connectDB = async () => {
    try {
        if (mongoose.connections[0].readyState) {
            return mongoose.connections[0];
        }
        
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        throw error;
    }
};

// Schedule installment check to run daily at 12:00 AM
const scheduleInstallmentCheck = () => {
  const now = new Date();
  const scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0, // 24-hour 
    0, // Minutes
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

// Schedule subscription check to run daily at 12:00 PM (noon)
const scheduleSubscriptionCheck = () => {
  const now = new Date();
  const scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    11, // 12 AM (noon)
    37,  // 0 minutes
    0   // 0 seconds
  );

  // If today's noon has passed, schedule for tomorrow
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const msToScheduledTime = scheduledTime.getTime() - now.getTime();
  console.log(`Next subscription check scheduled for: ${scheduledTime.toLocaleString()}`);

  // First run at next noon
  setTimeout(() => {
    console.log('Running subscription check...');
    checkSubscriptions();
    // Then run every 24 hours
    setInterval(() => {
      console.log('Running daily subscription check...');
      checkSubscriptions();
    }, 24 * 60 * 60 * 1000);
  }, msToScheduledTime);
};

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to CMS API' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Error handling middleware (add before routes)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// Remove the conditional startup
let isConnected = false;

const startServer = async () => {
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }
    return app;
};

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8080;
    startServer().then(() => {
        scheduleInstallmentCheck();
        scheduleSubscriptionCheck();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    });
}

// Export for Vercel
module.exports = async (req, res) => {
    try {
        if (!isConnected) {
            await connectDB();
            isConnected = true;
        }
        return app(req, res);
    } catch (error) {
        console.error('Server error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
};
