const fs = require('fs');
const path = require('path');

// Load .env variables locally if exists
if (fs.existsSync('.env')) {
  require('dotenv').config();
}

const env = process.env;

const FILES_TO_BUILD = [
  { src: 'index.html', dest: 'index.html' },
  { src: 'firebase-config.js', dest: 'firebase-config.js' }
];

const REPLACEMENTS = {
  '__FIREBASE_API_KEY__': env.FIREBASE_API_KEY || '',
  '__FIREBASE_AUTH_DOMAIN__': env.FIREBASE_AUTH_DOMAIN || '',
  '__FIREBASE_PROJECT_ID__': env.FIREBASE_PROJECT_ID || '',
  '__FIREBASE_STORAGE_BUCKET__': env.FIREBASE_STORAGE_BUCKET || '',
  '__FIREBASE_MESSAGING_SENDER_ID__': env.FIREBASE_MESSAGING_SENDER_ID || '',
  '__FIREBASE_APP_ID__': env.FIREBASE_APP_ID || '',
  '__FIREBASE_MEASUREMENT_ID__': env.FIREBASE_MEASUREMENT_ID || '',
  '__CLOUDINARY_CLOUD_NAME__': env.CLOUDINARY_CLOUD_NAME || '',
  '__CLOUDINARY_UPLOAD_PRESET__': env.CLOUDINARY_UPLOAD_PRESET || ''
};

FILES_TO_BUILD.forEach(file => {
  let content = fs.readFileSync(file.src, 'utf8');
  
  Object.keys(REPLACEMENTS).forEach(key => {
    const value = REPLACEMENTS[key];
    content = content.split(key).join(value);
  });
  
  fs.writeFileSync(file.dest, content);
  console.log(`Successfully built ${file.dest}`);
});
