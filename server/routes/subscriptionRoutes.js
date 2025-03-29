const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { isAdmin } = require('../middleware/authMiddleware');

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

module.exports = router;
