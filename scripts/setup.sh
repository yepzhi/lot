#!/bin/bash

# LOT — Local Setup & Secret Injection
# This script helps you configure your local environment without leaking keys to Git.

echo "✦ LOT Marketplace — Setup"

if [ ! -f .env ]; then
  echo "Creating .env file..."
  read -p "Firebase API Key: " f_key
  read -p "Firebase Auth Domain: " f_auth
  read -p "Firebase Project ID: " f_id
  read -p "Firebase Storage Bucket: " f_bucket
  read -p "Firebase Messaging Sender ID: " f_send
  read -p "Firebase App ID: " f_app
  read -p "Firebase Measurement ID: " f_meas
  read -p "Cloudinary Cloud Name: " c_name
  read -p "Cloudinary Upload Preset: " c_preset

  cat <<EOF > .env
FIREBASE_API_KEY=$f_key
FIREBASE_AUTH_DOMAIN=$f_auth
FIREBASE_PROJECT_ID=$f_id
FIREBASE_STORAGE_BUCKET=$f_bucket
FIREBASE_MESSAGING_SENDER_ID=$f_send
FIREBASE_APP_ID=$f_app
FIREBASE_MEASUREMENT_ID=$f_meas
CLOUDINARY_CLOUD_NAME=$c_name
CLOUDINARY_UPLOAD_PRESET=$c_preset
EOF
  echo "✅ .env created."
else
  echo "ℹ️ .env already exists."
fi

echo "Running build injection..."
node scripts/build.js

echo "🚀 Setup complete. Your local index.html and firebase-config.js are now configured."
