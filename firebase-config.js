// ─── LOT — Firebase Config ──────────────────────────────────
// yepzhi.com/lot · Marketplace Clasificados
// Proyecto Firebase: nlot-89d26
// ────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "__FIREBASE_API_KEY__",
  authDomain:        "__FIREBASE_AUTH_DOMAIN__",
  projectId:         "__FIREBASE_PROJECT_ID__",
  storageBucket:     "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId:             "__FIREBASE_APP_ID__",
  measurementId:     "__FIREBASE_MEASUREMENT_ID__"
};

// Cloudinary — Imágenes sin costo (25GB gratis)
// Upload Preset "__CLOUDINARY_UPLOAD_PRESET__" debe estar creado en el dashboard:
// Cloudinary → Settings → Upload presets → Add → Unsigned → nombre: __CLOUDINARY_UPLOAD_PRESET__
const CLOUDINARY_CONFIG = {
  cloudName:    "__CLOUDINARY_CLOUD_NAME__",
  uploadPreset: "__CLOUDINARY_UPLOAD_PRESET__"
};

export { firebaseConfig, CLOUDINARY_CONFIG };

