# LOT — yepzhi.com/lot
## Marketplace de Clasificados · Documento de Arquitectura & Desarrollo
**Versión:** 1.0 · **Stack recomendado:** Firebase + Vanilla JS o Next.js  
**Design System:** Glassmorphism · Paleta oscura · Fuentes: Syne + DM Sans  
**URL destino:** `https://yepzhi.com/lot`

---

## 1. 🏗️ ARQUITECTURA RECOMENDADA

### ¿Por qué Firebase?
Firebase es **la opción ideal** para este proyecto porque:
- **Firestore** (NoSQL) — colección de listings con queries en tiempo real
- **Firebase Storage** — almacenamiento de imágenes (reglas por usuario)
- **Firebase Auth** — login con Google/número de teléfono (WhatsApp-like)
- **Firebase Hosting** — deploy rápido, CDN global
- **Costo:** Gratis hasta ~50K lecturas/día y ~1GB de storage en el plan Spark
- **Alternativa:** Supabase (PostgreSQL + S3-compatible, open-source) — válida si prefieres SQL

### Stack completo recomendado
```
Frontend:   Next.js 14 (App Router) · React 18
Backend:    Firebase Firestore + Storage + Auth
Imágenes:   Compresión client-side (Canvas API → WebP) + Firebase Storage
Deploy:     Vercel (frontend) + Firebase (backend/storage)
Dominio:    yepzhi.com/lot → configurar rewrite en Next.js o subdominio lot.yepzhi.com
Search:     Algolia (plan gratis 10K searches/mes) o Firestore composite indexes
CDN imgs:   Firebase Storage URLs (automático) + imgix opcional
```

---

## 2. 📁 ESTRUCTURA DE PROYECTO

```
lot/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout global con fuentes + providers
│   ├── page.tsx                  # Home: feed + categorías + búsqueda
│   ├── listing/[id]/page.tsx     # Detalle de anuncio
│   ├── post/page.tsx             # Formulario publicar anuncio
│   └── api/
│       └── listings/route.ts     # API routes (opcional si usas Firestore directo)
├── components/
│   ├── Header.tsx                # Barra navegación + búsqueda + botón publicar
│   ├── CategoryPills.tsx         # Grid de categorías clickeables
│   ├── ListingCard.tsx           # Card de anuncio (imagen, precio, meta)
│   ├── ListingGrid.tsx           # Grid responsive de cards
│   ├── PostForm.tsx              # Modal formulario nuevo anuncio
│   ├── ImageUploader.tsx         # 4 slots con compresión automática
│   ├── SearchBar.tsx             # Input con exact match + fallback similar
│   └── DetailModal.tsx           # Vista detallada del anuncio
├── lib/
│   ├── firebase.ts               # Init Firebase app
│   ├── firestore.ts              # CRUD listings
│   ├── storage.ts                # Upload/delete imágenes
│   └── imageCompress.ts          # Canvas → WebP ≤0.5MB
├── types/
│   └── listing.ts                # TypeScript interfaces
├── styles/
│   └── globals.css               # Variables CSS + base styles
└── public/
    └── og-image.png              # Open Graph image para SEO
```

---

## 3. 🗄️ FIRESTORE — SCHEMA

### Colección: `listings`
```typescript
interface Listing {
  id: string;                    // Auto-generado por Firestore
  title: string;                 // Max 80 chars
  description: string;           // Max 1000 chars
  price: number;                 // 0 = "Gratis"
  category: Category;            // enum (ver abajo)
  city: string;                  // Ej: "Hermosillo, Son."
  contact: string;               // WhatsApp o email
  images: string[];              // URLs de Firebase Storage (1-4)
  userId: string;                // UID de Firebase Auth
  userDisplayName: string;
  userAvatar?: string;
  status: 'active' | 'sold' | 'paused';
  createdAt: Timestamp;          // SIEMPRE ordenar por este campo DESC
  updatedAt: Timestamp;
  views: number;                 // Incrementar con FieldValue.increment(1)
  favorites: number;
}

type Category = 
  | 'carros'
  | 'casas'
  | 'love'
  | 'fiestas'
  | 'servicios'
  | 'telefonos'
  | 'computacion'
  | 'pantallas'
  | 'ropa'
  | 'zapatos';
```

### Índices de Firestore necesarios
```
Colección: listings
- category (ASC) + createdAt (DESC)    → filtro categoría + orden fecha
- status (ASC) + createdAt (DESC)      → solo activos
- userId (ASC) + createdAt (DESC)      → "Mis anuncios"
```

### Notas de contacto — Solo WhatsApp
- El campo `contact` almacena **10 dígitos** sin prefijo (ej: `6621234567`)
- Al abrir WhatsApp se prefija automáticamente `52` → `wa.me/526621234567`
- Validar en frontend: `pattern="[0-9]{10}"` + `maxlength="10"`
- En Firestore Rules se puede validar: `request.resource.data.contact.matches('[0-9]{10}')`

### Colección: `users` (opcional)
```typescript
interface User {
  uid: string;
  displayName: string;
  phone?: string;
  whatsapp?: string;
  avatar?: string;
  city?: string;
  createdAt: Timestamp;
  listingsCount: number;
  favoritesCount: number;
}
```

---

## 4. 📸 SISTEMA DE IMÁGENES

### Flujo client-side (ya implementado en el HTML base)
```typescript
// lib/imageCompress.ts
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 900; // px
        let { width: w, height: h } = img;

        // Redimensionar manteniendo ratio
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
          else       { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
        }

        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);

        // Intentar WebP primero
        canvas.toBlob((blob) => {
          if (blob && blob.size <= 500_000) return resolve(blob);
          // Fallback a JPEG con menor calidad
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.65);
        }, 'image/webp', 0.78);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}
```

### Upload a Firebase Storage
```typescript
// lib/storage.ts
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export async function uploadListingImage(
  file: File,
  userId: string,
  listingId: string,
  index: number
): Promise<string> {
  const compressed = await compressImage(file);
  const storage = getStorage();
  const ext = 'webp';
  const path = `listings/${userId}/${listingId}/img_${index}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressed, { contentType: 'image/webp' });
  return await getDownloadURL(storageRef);
}
```

### Reglas de Firebase Storage
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /listings/{userId}/{listingId}/{imgFile} {
      // Solo el dueño puede subir/borrar
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 600 * 1024  // max 600KB como safety net
                   && request.resource.contentType.matches('image/.*');
      // Cualquiera puede leer
      allow read: if true;
    }
  }
}
```

---

## 5. 🔍 SISTEMA DE BÚSQUEDA

### Estrategia: dos niveles

**Nivel 1 — Firestore (búsqueda básica)**
```typescript
// Exact match con array-contains en campo de tokens
// Al crear listing, tokenizar el título:
const searchTokens = title.toLowerCase()
  .split(/\s+/)
  .filter(w => w.length > 2);
// Guardar en el documento: searchTokens: ['iphone', 'pro', 'max', '256gb']

// Query:
const q = query(
  collection(db, 'listings'),
  where('searchTokens', 'array-contains', searchWord),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc'),
  limit(40)
);
```

**Nivel 2 — Algolia (búsqueda avanzada, RECOMENDADO)**
```
Plan gratuito: 10,000 búsquedas/mes · 1M registros
Instala: npm install algoliasearch
Sync: Cloud Function que escucha onCreate/onDelete en Firestore
Características: typo-tolerance, ranking por relevancia, highlighting
```

```typescript
// Ejemplo de búsqueda con fallback
export async function searchListings(query: string, category?: string) {
  try {
    // Primero buscar exact match
    const exactResults = await algoliaSearch(query, { filters: category ? `category:${category}` : '' });
    if (exactResults.hits.length > 0) return { results: exactResults.hits, similar: false };
    
    // Si no hay exactos, buscar similares (Algolia lo hace automáticamente con typo-tolerance)
    return { results: exactResults.hits, similar: true };
  } catch {
    // Fallback a Firestore si Algolia falla
    return firestoreSearch(query, category);
  }
}
```

---

## 6. 🔐 AUTENTICACIÓN

### Firebase Auth — Flujo recomendado
```
Opción A: Login con teléfono (SMS OTP) → ideal para México/Latinoamérica
Opción B: Login con Google → más rápido de implementar
Opción C: Ambas (recomendado)
```

```typescript
// Autenticación anónima temporal (para ver, no para publicar)
// Al intentar publicar → solicitar login

import { signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Google Sign-In
const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);

// Phone Sign-In (requiere reCAPTCHA)
const confirmationResult = await signInWithPhoneNumber(auth, '+52662XXXXXXX', recaptchaVerifier);
const credential = await confirmationResult.confirm(otpCode);
```

### Reglas de Firestore
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /listings/{listingId} {
      allow read: if true;   // Cualquiera puede leer
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null
                             && resource.data.userId == request.auth.uid;
    }
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 7. 📱 CATEGORÍAS — CONFIGURACIÓN FINAL

```typescript
// Categorías principales (pills en home)
export const MAIN_CATS = [
  { id: 'all',       label: 'Todo',       icon: '⚡' },
  { id: 'carros',    label: 'Carros',     icon: '🚗', color: '#7DF9FF' },
  { id: 'fiestas',   label: 'Fiestas',    icon: '🎉', color: '#FFD166',
    desc: 'Publica tu fiesta, local, música o servicio de evento' },
  { id: 'servicios', label: 'Servicios',  icon: '🔧', color: '#80FFE8' },
  { id: 'telefonos', label: 'Teléfonos',  icon: '📱', color: '#6B9FFF' },
  { id: 'otros',     label: 'Otros ›',    icon: '📦', color: '#C8B6FF',
    drawer: true }, // Expande el sub-drawer
] as const;

// Sub-categorías dentro de "Otros" (drawer expandible)
export const OTROS_SUBCATS = [
  { id: 'casas',        label: 'Casas / Inmuebles', icon: '🏠' },
  { id: 'computacion',  label: 'Computación',        icon: '💻' },
  { id: 'pantallas',    label: 'Pantallas / TV',      icon: '📺' },
  { id: 'ropa',         label: 'Ropa',                icon: '👕' },
  { id: 'zapatos',      label: 'Tenis / Zapatos',     icon: '👟' },
] as const;
```

### UX del drawer "Otros"
- Click en **Otros** → abre drawer con sub-pills debajo
- Click en sub-pill → filtra por esa sub-cat y cierra otros
- Click en **Otros** de nuevo → colapsa drawer y resetea filtro

---

## 8. 📐 DISEÑO MOBILE-FIRST

- **Grid de listings:** 2 columnas en mobile, auto-fill ≥220px en desktop
- **Modales:** Bottom sheet (slide up desde abajo) con drag handle — más natural en touch
- **Search:** Centrado debajo del hero, fuera del header
- **Header:** Solo logo + botón Publicar — sin ruido
- **Categorías:** flex-wrap con scroll horizontal en pantallas muy pequeñas
- **Touch targets:** Pills de categorías ≥44px de alto

## 9. 🚀 GUÍA DE INSTALACIÓN Y DEPLOY

### Setup inicial
```bash
# Crear proyecto Next.js
npx create-next-app@latest lot --typescript --tailwind --app

cd lot
npm install firebase algoliasearch

# Instalar Firebase CLI
npm install -g firebase-tools
firebase login
firebase init  # Seleccionar: Firestore, Storage, Hosting, Functions (opcional)
```

### Variables de entorno (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=    # Solo la clave de BÚSQUEDA (no admin)
ALGOLIA_ADMIN_KEY=                  # Solo en server-side
```

### Deploy
```bash
# Vercel (frontend Next.js)
vercel --prod

# Firebase (Firestore rules + Storage rules)
firebase deploy --only firestore:rules,storage:rules

# Si usas Firebase Hosting para el frontend
npm run build
firebase deploy --only hosting
```

### Configurar yepzhi.com/lot
```nginx
# En el servidor de yepzhi.com (nginx), redirigir /lot al deploy de Next.js:
location /lot {
  proxy_pass https://lot.vercel.app;
  proxy_set_header Host $host;
  # O usar rewrite en Vercel con basePath: '/lot' en next.config.js
}
```

```javascript
// next.config.js
module.exports = {
  basePath: '/lot',
  trailingSlash: false,
}
```

---

## 9. 🎨 DESIGN SYSTEM — TOKENS CSS

```css
:root {
  /* Colores */
  --bg: #050810;
  --glass: rgba(255,255,255,0.05);
  --glass-border: rgba(255,255,255,0.10);
  --glass-hover: rgba(255,255,255,0.09);
  --accent-cyan: #7DF9FF;
  --accent-pink: #FF6BF8;
  --accent-yellow: #FFD166;
  --text: #F0F4FF;
  --muted: rgba(240,244,255,0.45);
  
  /* Tipografía */
  --font-head: 'Syne', sans-serif;    /* Títulos, precios, logo */
  --font-body: 'DM Sans', sans-serif; /* Cuerpo, etiquetas */
  
  /* Espaciado */
  --radius: 18px;
  --radius-sm: 12px;
  --blur: blur(18px);
  
  /* Sombras */
  --shadow-card: 0 8px 32px rgba(0,0,0,0.45);
  --glow-cyan: 0 0 24px rgba(125,249,255,0.3);
  --glow-pink: 0 0 24px rgba(255,107,248,0.3);
}
```

---

## 10. ✅ ROADMAP DE FUNCIONALIDADES

### Fase 1 — MVP (ya en el HTML base)
- [x] Grid de anuncios con cards glassmorphism
- [x] Categorías con pills filtrables
- [x] Búsqueda con exact match + fallback similar
- [x] Formulario de publicación con 4 fotos
- [x] Compresión de imágenes client-side (Canvas → WebP ≤0.5MB)
- [x] Modal de detalle del anuncio
- [x] Sort por más reciente
- [x] Botón de favoritos por card
- [x] Toast notifications
- [x] Responsive mobile

### Fase 2 — Con Firebase
- [ ] Persistencia real en Firestore
- [ ] Firebase Auth (Google + Teléfono)
- [ ] Upload real de imágenes a Firebase Storage
- [ ] Paginación con `startAfter` cursor
- [ ] Página "Mis anuncios" por usuario
- [ ] Marcar como vendido

### Fase 3 — Features avanzados
- [ ] Algolia search (typo-tolerance, highlights)
- [ ] Subcategorías expandibles
- [ ] Filtros de precio (min/max)
- [ ] Chat interno (Firebase Realtime DB)
- [ ] Notificaciones push (Firebase Messaging)
- [ ] Reportar anuncio
- [ ] Verificación de número WhatsApp
- [ ] Panel de moderación

### Fase 4 — Growth
- [ ] SEO dinámico (Open Graph por listing)
- [ ] PWA (instalar como app)
- [ ] Anuncios destacados (paid feature)
- [ ] Mapa de listings por ciudad (Google Maps)
- [ ] Compartir listing por link directo

---

## 11. 📦 DEPENDENCIES CLAVE

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "firebase": "^10.0.0",
    "algoliasearch": "^4.20.0",
    "react-hot-toast": "^2.4.0",       // Notificaciones
    "zustand": "^4.4.0",               // State management (ligero)
    "react-image-crop": "^11.0.0"      // Crop opcional de imágenes
  }
}
```

---

## 12. 🔒 CONSIDERACIONES DE SEGURIDAD

1. **Nunca** exponer la clave admin de Algolia en el frontend
2. **Validar** en Firestore Rules que `userId == auth.uid` antes de writes
3. **Limitar** upload de imágenes a tipos `image/*` y tamaño máximo 600KB (server-side check en Storage Rules)
4. **Rate limiting:** Firebase tiene límites nativos; agregar throttle en el formulario (deshabilitar botón 3s post-submit)
5. **Content moderation:** Considerar Firebase Extension "Offensive Content Filter" o moderación manual con panel admin
6. **CORS:** Configurar Storage para permitir solo dominios propios en producción

---

## 13. 💰 ESTIMACIÓN DE COSTOS (Firebase Spark → Blaze)

| Recurso | Plan Gratuito | Costo aproximado |
|---------|--------------|-----------------|
| Firestore reads | 50K/día | $0.06 por 100K |
| Firestore writes | 20K/día | $0.18 por 100K |
| Storage | 5GB | $0.026/GB/mes |
| Hosting | 10GB transfer | $0.15/GB extra |
| Auth | Ilimitado | Gratis |

**Para ~1,000 usuarios activos/día:** estimado ~$5-15 USD/mes

---

## 14. 📝 NOTAS PARA ANTIGRAVITY/SONNET

Este documento acompaña el archivo `index.html` que es el **prototipo funcional completo** del frontend. Incluye:
- Diseño glassmorphism con orbes animados de fondo
- Sistema completo de categorías y búsqueda (client-side demo)
- Compresión de imágenes con Canvas API ya implementada
- Modales de publicación y detalle
- 12 listings de demo para visualizar el diseño

**Próximos pasos sugeridos:**
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Reemplazar datos demo con lecturas reales de Firestore
3. Implementar Auth con Google (más simple) primero
4. Conectar el upload de imágenes al Storage real
5. Agregar Algolia para búsqueda production-grade

El diseño está definido en tokens CSS variables — fácil de tematizar.
El sort `orderBy('createdAt', 'desc')` es la única regla de ordenamiento.

---

*Generado para yepzhi.com/lot · Stack: Firebase + Next.js · Diseño: Glassmorphism Dark*
