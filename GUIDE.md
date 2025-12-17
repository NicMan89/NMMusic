# 🎵 Guida Completa - MyMusic PWA

## 📋 Indice
1. [Setup Firebase](#setup-firebase)
2. [Configurazione Progetto](#configurazione-progetto)
3. [Deploy su GitHub Pages](#deploy-github-pages)
4. [Utilizzo App](#utilizzo-app)
5. [Troubleshooting](#troubleshooting)

---

## 🔥 Setup Firebase

### Passo 1: Crea Progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca "Aggiungi progetto"
3. Nome progetto: `mymusic-pwa` (o quello che preferisci)
4. Google Analytics: puoi disabilitarlo per ora
5. Clicca "Crea progetto"

### Passo 2: Configura Authentication

1. Nel menu laterale: **Authentication**
2. Clicca "Inizia"
3. **Sign-in method**:
   - Abilita "Email/Password"
   - (Opzionale) Abilita "Google" per login social

### Passo 3: Configura Firestore

1. Nel menu laterale: **Firestore Database**
2. Clicca "Crea database"
3. Modalità: **Inizia in modalità produzione**
4. Località: Scegli la più vicina (es: `europe-west1`)
5. Clicca "Abilita"

### Passo 4: Imposta Regole Firestore

1. Vai in **Firestore Database > Rules**
2. Copia il contenuto di `firestore.rules`
3. Incolla nell'editor
4. Clicca "Pubblica"

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /playlists/{playlistId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Passo 5: Ottieni Credenziali

1. Vai in **Impostazioni Progetto** (icona ingranaggio)
2. Scorri fino a "Le tue app"
3. Clicca sull'icona **Web** `</>`
4. Nickname app: `mymusic-web`
5. NON abilitare Firebase Hosting (useremo GitHub Pages)
6. Clicca "Registra app"
7. **COPIA** la configurazione che appare

### Passo 6: Configura App

1. Apri `src/services/firebase-config.js`
2. Sostituisci i valori placeholder con quelli copiati:

```javascript
export const firebaseConfig = {
  apiKey: "AIzaSyC...",  // ← Il tuo
  authDomain: "mymusic-xxx.firebaseapp.com",  // ← Il tuo
  projectId: "mymusic-xxx",  // ← Il tuo
  storageBucket: "mymusic-xxx.appspot.com",  // ← Il tuo
  messagingSenderId: "123456789",  // ← Il tuo
  appId: "1:123456789:web:abc123"  // ← Il tuo
};
```

3. Salva il file

---

## ⚙️ Configurazione Progetto

### Installa Dipendenze

```bash
npm install
```

### Genera Icone PWA

```bash
# Richiede Python 3 e Pillow
pip install Pillow
python generate-icons.py
```

Oppure usa tool online:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### Test Locale

```bash
npm run dev
```

Apri http://localhost:5173

---

## 🚀 Deploy su GitHub Pages

### Opzione A: Deploy Automatico (Consigliato)

1. **Crea Repository GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TUO-USERNAME/mymusic-pwa.git
   git push -u origin main
   ```

2. **Abilita GitHub Pages**:
   - Vai su GitHub > Settings > Pages
   - Source: "GitHub Actions"
   - Il workflow `.github/workflows/deploy.yml` farà tutto

3. **Ogni push su `main` farà deploy automatico**

4. **L'app sarà disponibile su**:
   `https://TUO-USERNAME.github.io/mymusic-pwa/`

5. **IMPORTANTE**: Se usi sottocartella, modifica `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: '/mymusic-pwa/',  // ← Nome del tuo repo
     ...
   });
   ```

### Opzione B: Deploy Manuale

```bash
# Build
npm run build

# I file pronti sono in dist/
# Caricali manualmente su GitHub Pages
```

---

## 📱 Utilizzo App

### Primo Accesso

1. Apri l'app nel browser
2. **Registrati** con email e password
3. Viene creato automaticamente il tuo account

### Creare Playlist

1. Clicca il pulsante **+** nella sidebar
2. Inserisci nome playlist
3. La playlist appare nella lista

### Cercare Canzoni

1. Clicca **Cerca** nella sidebar
2. Digita nome canzone/artista
3. Clicca su un risultato per aggiungerlo

⚠️ **NOTA**: La ricerca YouTube richiede API key. Vedi sezione API.

### Riproduzione

1. Clicca su una playlist
2. Clicca su una canzone
3. Il player in basso si attiva
4. Controlli:
   - ⏯️ Play/Pause
   - ⏭️ Prossima
   - ⏮️ Precedente
   - 🔊 Volume
   - 🌙 Schermo nero (per mobile)

### Installare come App

**Android/Chrome:**
1. Menu (⋮) > "Installa app"
2. O banner in basso "Aggiungi a Home"

**iOS/Safari:**
1. Condividi 🔗 > "Aggiungi a Home"
2. L'icona apparirà come app nativa

### Schermo Nero (Mobile)

Per risparmiare batteria su mobile:
1. Clicca l'icona 🌙 nel player
2. Lo schermo diventa nero (ma resta tecnicamente acceso)
3. Controlli playback visibili
4. Risparmio batteria ~70-80%

---

## 🔧 Troubleshooting

### Errore Firebase: "Firebase config not found"

✅ **Soluzione**: Verifica `src/services/firebase-config.js` con le tue credenziali

### Errore Firestore: "Missing or insufficient permissions"

✅ **Soluzione**: 
1. Controlla le regole Firestore
2. Verifica di essere loggato
3. Firestore deve essere in modalità "production" con regole corrette

### Schermo nero non funziona su iOS

⚠️ **iOS limita background playback**: 
- YouTube API blocca riproduzione in background
- Lo schermo deve rimanere tecnicamente acceso
- È una limitazione di YouTube, non dell'app

### Service Worker non si aggiorna

✅ **Soluzione**:
```bash
# Incrementa versione cache in public/sw.js
const CACHE_NAME = 'mymusic-v2';  # v1 -> v2
```

### Build fallisce

✅ **Controlla**:
```bash
# Node version (usa 18+)
node --version

# Reinstalla dipendenze
rm -rf node_modules package-lock.json
npm install

# Build di nuovo
npm run build
```

### GitHub Actions fallisce

✅ **Controlla**:
1. Settings > Pages > Source: "GitHub Actions"
2. Permissions: Write access in Settings > Actions > General
3. Verifica il log del workflow

---

## 🎯 API YouTube (Ricerca)

Per abilitare la ricerca YouTube:

### Opzione 1: YouTube Data API v3

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea progetto o usa esistente
3. Abilita "YouTube Data API v3"
4. Crea credenziali (API Key)
5. Aggiungi key al progetto

**Limiti gratuiti**: 10,000 unità/giorno
**Costo ricerca**: ~100 unità per query

### Opzione 2: Backend Proxy

Crea un backend (Firebase Functions, Vercel, ecc.) che:
1. Riceve query dall'app
2. Chiama YouTube API con la tua key
3. Ritorna risultati

**Vantaggio**: Key nascosta, più sicura

### Opzione 3: Nessuna ricerca

Gli utenti possono:
1. Trovare video su YouTube direttamente
2. Copiare l'ID video (parte dopo `v=`)
3. Incollarlo nell'app

---

## 📊 Monitoraggio

### Firebase Console

- **Authentication** > Users: Vedi utenti registrati
- **Firestore** > Data: Vedi playlist create
- **Usage**: Monitora quota gratuita

### Limiti Gratuiti Firebase

- **Firestore**: 50K read, 20K write/giorno
- **Auth**: Illimitato
- **Storage**: 1 GB

Sufficienti per migliaia di utenti!

---

## 🔒 Sicurezza

### Best Practices

1. ✅ Firebase config è **pubblica** (OK)
2. ✅ Regole Firestore proteggono i dati
3. ⚠️ YouTube API key dovrebbe essere server-side
4. ✅ Usa HTTPS (automatico con GitHub Pages)

### Privacy

- Dati salvati solo su Firebase (tuo controllo)
- Nessun tracking
- No analytics (opzionale)

---

## 📞 Supporto

**Problemi?**
- Controlla console browser (F12)
- Verifica Firebase console per errori
- GitHub Issues del progetto

**Limitazioni note:**
- Riproduzione BG mobile: schermo deve essere acceso
- Pubblicità YouTube: non rimovibili (TOS)
- Limiti API gratuiti

---

## 📜 Licenza

MIT - Usa come vuoi!

**Disclaimer**: YouTube e i suoi contenuti sono proprietà di Google. Questa app è solo un player client-side che usa YouTube IFrame API secondo i termini di servizio.
