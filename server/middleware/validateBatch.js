const validateBatch = (req, res, next) => {
  const { name, startTime, endTime, openingDate } = req.body;

  // Validate batch name
  if (!name || name.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Batch name must be at least 3 characters long'
    });
  }

  // Validate times
  if (!startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'Start time and end time are required'
    });
  }

  // Validate that end time is after start time
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) {
    return res.status(400).json({
      success: false,
      message: 'End time must be after start time'
    });
  }

  // Validate opening date
  if (!openingDate) {
    return res.status(400).json({
      success: false,
      message: 'Opening date is required'
    });
  }

  next();
};

module.exports = {
  validateBatch
};
