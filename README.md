# 🎵 NM Music PWA

**Your Personal Music Playlists** - Powered by NMworks

Progressive Web App che usa YouTube come fonte audio con interfaccia moderna ispirata al brand NM Music.

## ✨ Brand Design

L'app integra il design brand NMworks con:
- **Palette colori**: Cyan luminoso (#00E5FF) + Viola (#9C27B0)
- **Logo NM Music**: Versione personalizzata con effetti neon
- **UI Elements**: Cornici luminose, progress bar gradient, effetti glow
- **Ispirazione**: Elementi geometrici e tech del logo originale

## 🚀 Utilizzo

### 1. Configurazione Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuovo progetto (o usa uno esistente)
3. Attiva **Authentication**:
   - Vai in Authentication > Sign-in method
   - Abilita "Email/Password"
   - (Opzionale) Abilita "Google"
   
4. Attiva **Firestore Database**:
   - Vai in Firestore Database
   - Crea database in modalità "production"
   - Regole iniziali (modifica dopo):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /playlists/{playlistId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

5. Ottieni le credenziali:
   - Vai in Impostazioni Progetto > Le tue app
   - Aggiungi app Web
   - Copia la configurazione Firebase

6. Crea il file `src/services/firebase-config.js`:
   ```javascript
   export const firebaseConfig = {
     apiKey: "TUA_API_KEY",
     authDomain: "tuo-progetto.firebaseapp.com",
     projectId: "tuo-progetto",
     storageBucket: "tuo-progetto.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

### 2. Installazione Dipendenze

```bash
npm install
```

### 3. Sviluppo Locale

```bash
npm run dev
```

Apri http://localhost:5173

### 4. Build e Deploy su GitHub Pages

```bash
npm run build
```

I file pronti saranno in `dist/`. Carica su GitHub Pages.

#### Setup GitHub Pages:
1. Crea repository su GitHub
2. Vai in Settings > Pages
3. Source: "GitHub Actions" o "Deploy from branch"
4. Carica il contenuto di `dist/`

**Importante**: Se usi sottocartella, modifica `base` in `vite.config.js`

## 📱 Installazione come App

- **Android/Chrome**: Menu > "Installa app" o "Aggiungi a schermata Home"
- **iOS/Safari**: Condividi > "Aggiungi a Home"

## ⚙️ Funzionalità

✅ Autenticazione utenti (Firebase)
✅ Playlist personalizzate
✅ Player YouTube integrato (solo audio)
✅ Riproduzione in background su desktop
✅ Schermo nero su mobile (risparmio batteria)
✅ Controlli in notifica (Media Session API)
✅ Ricerca video YouTube
✅ Installabile come PWA
✅ Offline ready (Service Worker)

## 🎨 UI Stile Spotify

- Sidebar con playlist
- Player bottom bar
- Dark theme
- Animazioni fluide

## 📝 Limitazioni

⚠️ **Mobile**: Schermo deve rimanere tecnicamente acceso (ma può essere nero)
⚠️ **YouTube API**: Limiti gratuiti giornalieri
⚠️ **Pubblicità**: Appariranno gli ads YouTube (non rimovibili legalmente)

## 🔒 Privacy

- Dati salvati su Firebase (tuo controllo)
- Nessun tracking
- No account YouTube richiesto

## 📄 Licenza

MIT
