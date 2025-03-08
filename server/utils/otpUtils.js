/**
 * Generates a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Verifies if the OTP is still valid based on its expiry time
 * @param {Date} expiryTime - The expiry timestamp of the OTP
 * @returns {boolean} - Whether the OTP is still valid
 */
const verifyOTPValidity = (expiryTime) => {
    return Date.now() < new Date(expiryTime).getTime();
};

module.exports = {
    generateOTP,
    verifyOTPValidity
};
