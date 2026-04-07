// ─── LOT — Firebase Config ──────────────────────────────────
// yepzhi.com/lot · Marketplace Clasificados
// Proyecto Firebase: nlot-89d26
// ────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "AIzaSyB47FLyT_6I7Ifn1wvEmYJQf6M8XC4IqUk",
  authDomain:        "nlot-89d26.firebaseapp.com",
  projectId:         "nlot-89d26",
  storageBucket:     "nlot-89d26.firebasestorage.app",
  messagingSenderId: "928352640563",
  appId:             "1:928352640563:web:f6eaeb7649fdd3ac28cd46",
  measurementId:     "G-KE9MFKBGV5"
};

// Cloudinary — Imágenes sin costo (25GB gratis)
// Upload Preset "lot_unsigned" debe estar creado en el dashboard:
// Cloudinary → Settings → Upload presets → Add → Unsigned → nombre: lot_unsigned
const CLOUDINARY_CONFIG = {
  cloudName:    "dtend86st",
  uploadPreset: "lot_unsigned"
};

export { firebaseConfig, CLOUDINARY_CONFIG };

