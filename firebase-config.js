// ─── LOT — Firebase Config ──────────────────────────────────
// yepzhi.com/lot · Marketplace Clasificados
// Proyecto Firebase: nlot-89d26
// ────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "__FIREBASE_API_KEY__",
  authDomain:        "nlot-89d26.firebaseapp.com",
  projectId:         "nlot-89d26",
  storageBucket:     "nlot-89d26.firebasestorage.app",
  messagingSenderId: "928352640563",
  appId:             "__FIREBASE_APP_ID__",
  measurementId:     "G-KE9MFKBGV5"
};

// Cloudinary — Imágenes sin costo (25GB gratis)
// Upload Preset "__CLOUDINARY_UPLOAD_PRESET__" debe estar creado en el dashboard:
// Cloudinary → Settings → Upload presets → Add → Unsigned → nombre: __CLOUDINARY_UPLOAD_PRESET__
const CLOUDINARY_CONFIG = {
  cloudName:    "__CLOUDINARY_CLOUD_NAME__",
  uploadPreset: "__CLOUDINARY_UPLOAD_PRESET__"
};

export { firebaseConfig, CLOUDINARY_CONFIG };

