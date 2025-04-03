const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { isAdmin, protect } = require('../middleware/authMiddleware');
const User = require('../models/User'); // Added User model import

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper function to upload to S3
const uploadToS3 = async (file, key) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

// Get pending payments count
router.get('/pending-payments/count', isAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments({
      'subscription.subscriptionStatus': 'pending',
      role: 'teacher'
    });
    
    res.json({ success: true, data: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get rejected payments count
router.get('/rejected-payments/count', isAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments({
      $or: [
        { 'subscription.subscriptionStatus': 'rejected' },
        { status: 'locked' }
      ],
      role: 'teacher'
    });
    
    res.json({
      success: true,
      data: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rejected payments count'
    });
  }
});

// Get all pending payments
router.get('/pending-payments', isAdmin, async (req, res) => {
  try {
    const pendingPayments = await User.find({
      'subscription.subscriptionStatus': 'pending',
      role: 'teacher'
    })
    .select('name email subscription profilePicture')
    .populate('subscription.planId');

    const formattedPayments = pendingPayments.map(user => ({
      _id: user._id,
      teacher: {
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      },
      plan: user.subscription?.planId || {},
      amount: user.subscription?.paymentDetails?.amount,
      paymentDate: user.subscription?.paymentDetails?.paymentDate,
      receipt: user.subscription?.paymentDetails?.receipt,
      transactionId: user.subscription?.paymentDetails?.transactionId,
      subscriptionStatus: user.subscription?.subscriptionStatus
    }));
    
    res.json({ 
      success: true, 
      data: formattedPayments 
    });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pending payments',
      error: error.message 
    });
  }
});

// Get rejected payments
router.get('/rejected-payments', isAdmin, async (req, res) => {
  try {
    const rejectedPayments = await User.find({
      $or: [
        { 'subscription.subscriptionStatus': 'rejected' },
        { status: 'locked' }
      ],
      role: 'teacher'
    })
    .select('name email subscription profilePicture status')
    .populate('subscription.planId');

    const formattedPayments = rejectedPayments.map(user => ({
      _id: user._id,
      teacher: {
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status
      },
      plan: user.subscription?.planId || {},
      amount: user.subscription?.paymentDetails?.amount,
      paymentDate: user.subscription?.paymentDetails?.paymentDate,
      receipt: user.subscription?.paymentDetails?.receipt,
      transactionId: user.subscription?.paymentDetails?.transactionId,
      subscriptionStatus: user.subscription?.subscriptionStatus
    }));
    
    res.json({ 
      success: true, 
      data: formattedPayments 
    });
  } catch (error) {
    console.error('Error fetching rejected payments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching rejected payments',
      error: error.message 
    });
  }
});

// Get all subscription plans (public route)
router.get('/', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get subscription plan by ID
router.get('/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new subscription plan (admin only)
router.post('/', isAdmin, upload.single('qrCode'), async (req, res) => {
  try {
    const { title, price, duration, maxBatches, accountHolderName, upiId, upiNumber } = req.body;
    
    let qrCodeData = {};
    if (req.file) {
      const key = `subscription-plans/qr-codes/${crypto.randomBytes(16).toString('hex')}`;
      const url = await uploadToS3(req.file, key);
      qrCodeData = { url, key };
    }

    const plan = new SubscriptionPlan({
      title,
      price: Number(price),
      duration: Number(duration),
      maxBatches: Number(maxBatches),
      accountHolderName,
      upiId,
      upiNumber,
      qrCode: qrCodeData
    });

    await plan.save();
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update subscription plan (admin only)
router.put('/:id', isAdmin, upload.single('qrCode'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle QR code update if new file is provided
    if (req.file) {
      const key = `subscription-plans/qr-codes/${crypto.randomBytes(16).toString('hex')}`;
      const url = await uploadToS3(req.file, key);
      updateData.qrCode = { url, key };
    }

    // Convert numeric fields
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.duration) updateData.duration = Number(updateData.duration);
    if (updateData.maxBatches) updateData.maxBatches = Number(updateData.maxBatches);

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete subscription plan (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id, 
      { isActive: false },
      { new: true }
    );
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Verify payment endpoint
router.put('/verify-payment/:userId', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only update user status when activating, not when rejecting
    user.subscription.subscriptionStatus = status;
    if (status === 'active') {
      user.status = 'active';
    }
    
    await user.save();

    res.json({
      success: true,
      message: `Payment ${status}`,
      data: {
        subscriptionStatus: user.subscription.subscriptionStatus,
        userStatus: user.status
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
});

// Submit payment for subscription plan
router.post('/:planId/submit-payment', protect, upload.single('receipt'), async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    let receiptData = {};
    if (req.file) {
      const key = `subscription-payments/${req.user.id}/${crypto.randomBytes(16).toString('hex')}`;
      const url = await uploadToS3(req.file, key);
      receiptData = { url, key };
    }

    const user = await User.findById(req.user.id);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration);

    user.subscription = {
      planId: plan._id,
      startDate: new Date(),
      endDate: endDate,
      subscriptionStatus: 'pending',
      paymentDetails: {
        amount: plan.price,
        transactionId: crypto.randomBytes(8).toString('hex'),
        paymentDate: new Date(),
        receipt: receiptData
      }
    };

    await user.save();

    res.json({
      success: true,
      message: 'Payment submitted successfully',
      data: user.subscription
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manual trigger for checking subscriptions (admin only)
router.post('/check-expirations', isAdmin, async (req, res) => {
  try {
    await checkSubscriptions();
    res.json({
      success: true,
      message: 'Subscription check completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking subscriptions',
      error: error.message
    });
  }
});

module.exports = router;
