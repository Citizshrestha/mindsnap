// config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Debug: Check if environment variables are loaded
// console.log('=== CLOUDINARY CONFIGURATION ===');
// console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
// console.log('Cloudinary API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing');
// console.log('Cloudinary API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Missing Cloudinary environment variables!');
  console.error('Please check your .env file has:');
  console.error('CLOUDINARY_CLOUD_NAME=your_cloud_name');
  console.error('CLOUDINARY_API_KEY=your_api_key');
  console.error('CLOUDINARY_API_SECRET=your_api_secret');
} else {
  // console.log('✅ Cloudinary environment variables are set');
}

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Test the configuration
cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connection successful:', result);
  })
  .catch(error => {
    console.error('❌ Cloudinary connection failed:', error.message);
  });

export default cloudinary;