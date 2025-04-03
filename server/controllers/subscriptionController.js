exports.getRejectedPaymentsCount = async (req, res) => {
    try {
        const count = await User.countDocuments({
            'subscription.subscriptionStatus': 'rejected'
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
};
