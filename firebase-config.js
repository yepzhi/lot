// ─── LOT — Firebase Config ──────────────────────────────────
// yepzhi.com/lot · Marketplace Clasificados
//
// ⚠️  INSTRUCCIONES:
// 1. Ve a https://console.firebase.google.com
// 2. Crea (o abre) el proyecto para LOT
// 3. Proyecto → Configuración → Tus apps → Web → Registrar app "lot"
// 4. Copia el objeto firebaseConfig que te da Firebase y pégalo aquí
// 5. Habilita en Firebase Console:
//    - Authentication → Sign-in method → Google ✓
//    - Firestore Database → Crear base de datos (modo producción)
//    - Storage (requiere plan Blaze) — o usa Cloudinary (ver index.html)
// ────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};

// Cloudinary (imágenes sin costo — RECOMENDADO sobre Firebase Storage)
// 1. Crea cuenta en https://cloudinary.com (gratis, 25GB)
// 2. Dashboard → Settings → Upload → Add upload preset → Unsigned
// 3. Copia el Cloud Name y el Upload Preset
const CLOUDINARY_CONFIG = {
  cloudName:    "TU_CLOUD_NAME",   // Ej: "dxyz1234"
  uploadPreset: "__CLOUDINARY_UPLOAD_PRESET__"      // El preset que creaste (unsigned)
};

export { firebaseConfig, CLOUDINARY_CONFIG };
