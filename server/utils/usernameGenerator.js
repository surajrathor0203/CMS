const User = require('../models/User');

const generateUsername = async (name) => {
    // Remove special characters and convert to lowercase
    let baseUsername = name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '')
        .trim();
    
    let username = baseUsername;
    let counter = 1;
    
    // Keep checking until we find a unique username
    while (true) {
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
            return username;
        }
        // If username exists, append number and try again
        username = `${baseUsername}${counter}`;
        counter++;
    }
};

module.exports = { generateUsername };
