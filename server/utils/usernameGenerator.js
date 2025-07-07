const User = require('../models/User');
const Student = require('../models/Student'); // Add this import

const generateUsername = async (name) => {
    // Remove special characters and convert to lowercase
    let baseUsername = name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '')
        .trim();
    
    let username = baseUsername;
    let counter = 1;
    
    // Keep checking until we find a unique username in both User and Student collections
    while (true) {
        const existingUser = await User.findOne({ username });
        const existingStudent = await Student.findOne({ username });
        if (!existingUser && !existingStudent) {
            return username;
        }
        // If username exists, append number and try again
        username = `${baseUsername}${counter}`;
        counter++;
    }
};

module.exports = { generateUsername };
