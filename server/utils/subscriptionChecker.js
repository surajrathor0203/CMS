const User = require('../models/User');

const checkSubscriptions = async () => {
  try {
    const today = new Date();
    
    // Find users with expired subscriptions
    const usersToUpdate = await User.find({
      'subscription.endDate': { $lt: today },
      'subscription.subscriptionStatus': { $in: ['active', 'Free trial'] },
      role: 'teacher'
    });

    // Update status for expired subscriptions
    for (const user of usersToUpdate) {
      user.subscription.subscriptionStatus = 'expired';
      user.status = 'locked';
      await user.save();
      console.log(`Updated status for user: ${user.email}`);
    }

    console.log(`Checked ${usersToUpdate.length} subscriptions`);
  } catch (error) {
    console.error('Error checking subscriptions:', error);
  }
};

module.exports = checkSubscriptions;
