const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4',
});

const corsParams = {
  Bucket: process.env.AWS_BUCKET_NAME,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedOrigins: [
          'http://localhost:3000',
          'https://cms-rgum.vercel.app',
          'https://cms-two-murex.vercel.app'
        ],
        ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
        MaxAgeSeconds: 3000
      }
    ]
  }
};

// Set bucket CORS policy
const setBucketPolicy = async () => {
  try {
    // Set CORS
    await s3.putBucketCors(corsParams).promise();
    
    // Make bucket public
    const publicReadPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${process.env.AWS_BUCKET_NAME}/*`]
        }
      ]
    };

    await s3.putBucketPolicy({
      Bucket: process.env.AWS_BUCKET_NAME,
      Policy: JSON.stringify(publicReadPolicy)
    }).promise();

    console.log('Successfully set bucket policies');
  } catch (err) {
    console.error('Error setting bucket policies:', err);
  }
};

setBucketPolicy();

module.exports = s3;
