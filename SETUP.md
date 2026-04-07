# LOT — Setup Guide
## yepzhi.com/lot · Firebase + Cloudinary

---

## PASO 1 — Firebase Console

### 1a. Obtener la config Web
1. Ve a https://console.firebase.google.com → Proyecto **nlot-89d26**
2. Configuración del proyecto (⚙️) → **Tus apps** → **Web** (ícono `</>`)
3. Si no tienes app web creada: **Registrar app** → nombre: `lot`
4. Copia el objeto `firebaseConfig` que aparece
5. Pégalo en `index.html` donde dice `PEGA_TU_API_KEY_AQUI`

### 1b. Activar Firestore
1. Firebase Console → **Firestore Database** → **Crear base de datos**
2. Selecciona: **Modo de producción** → Ubicación: `us-central1`
3. Ve a la pestaña **Reglas** → Borra lo que hay → Pega el contenido de `firestore.rules` → Publicar

### 1c. Crear índice compuesto (requerido para la query)
1. Firestore → **Índices** → **Índices compuestos** → **Crear índice**
2. Colección: `listings`
3. Campos:
   - `status` → Ascendente
   - `createdAt` → Descendente
4. Ámbito: Colección → **Crear**
5. Espera ~2 minutos a que se construya

---

## PASO 2 — Cloudinary (imágenes gratuitas)

### 2a. Crear Upload Preset (unsigned)
1. Ve a https://cloudinary.com → Login → **Dashboard**
2. Menú izquierdo → **Settings** → **Upload**
3. Scroll hasta **Upload presets** → **Add upload preset**
4. Configura:
   - **Preset name:** `__CLOUDINARY_UPLOAD_PRESET__`
   - **Signing Mode:** `Unsigned` ← IMPORTANTE
   - **Folder:** `lot`
5. **Save**

Tus datos ya están en `index.html`:
- Cloud name: `__CLOUDINARY_CLOUD_NAME__` ✅
- Upload preset: `__CLOUDINARY_UPLOAD_PRESET__` (debes crearlo en el paso anterior)

---

## PASO 3 — GitHub Pages

### 3a. Push inicial
```bash
cd /Users/yepz/lot
git add .
git commit -m "feat: LOT v2.1.0 — Firebase + Cloudinary + dual moderation"
git push -u origin main
```

### 3b. Activar GitHub Pages
1. https://github.com/yepzhi/lot → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` → Folder: `/ (root)` → **Save**
4. El sitio estará en: `https://yepzhi.github.io/lot/`

### 3c. Apuntar yepzhi.com/lot (Cloudflare)
Ya que tienes Cloudflare en yepzhi.com y GitHub Pages:
1. GitHub Pages ya maneja el subdirectorio `/lot` automáticamente
   si `yepzhi.github.io` es tu raíz
2. En Cloudflare → DNS: CNAME `@` → `yepzhi.github.io`
3. En GitHub → Settings → Pages → Custom domain: `yepzhi.com`
4. El path `/lot` funciona automáticamente desde el repo `lot`

---

## PASO 4 — Datos de prueba

Abre `yepzhi.com/lot` o `yepzhi.github.io/lot/` y publica un anuncio de prueba.

Verifica en Firebase Console → Firestore → colección `listings` que el documento se creó con:
- `status: "active"`
- `expiresAt`: fecha 6 meses en el futuro
- `images`: array de URLs de Cloudinary
- `contact`: número de 10 dígitos

---

## Resumen del sistema de moderación

```
LAYER 1 — NSFWJS (client-side, pre-upload)
  Usuario selecciona foto
    → TF.js + MobileNetV2 (~5MB, carga lazy al abrir modal)
    → Clasifica: Neutral | Drawing | Sexy | Porn | Hentai
    → Porn > 55% OR Hentai > 55% → BLOQUEADO (foto nunca llega a Cloudinary)

LAYER 2 — Community 10-IP reports (post-publish)
  Usuario reporta anuncio
    → Se obtiene IP pública (api.ipify.org)
    → Se guarda como doc en listings/{id}/reports/{ip}
    → Si llega a 10 IPs distintas:
        → listing.status = 'suspended'
        → banned_phones/{phone} creado (ban permanente)

LAYER 3 — Phone ban check (pre-publish)
  Al intentar publicar:
    → Consulta banned_phones/{numero}
    → Si existe → publicación bloqueada con mensaje claro
```
