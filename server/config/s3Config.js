const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4',
  // Add cors configuration
  cors: {
    allowedHeaders: ['*'],
    allowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
    allowedOrigins: ['*'],
    exposeHeaders: ['ETag']
  }
});

// Set bucket CORS policy
const setBucketCorsPolicy = async () => {
  const corsParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3000
        }
      ]
    }
  };

  try {
    await s3.putBucketCors(corsParams).promise();
    console.log('Successfully set CORS policy');
  } catch (err) {
    console.error('Error setting CORS policy:', err);
  }
};

setBucketCorsPolicy();

module.exports = s3;
