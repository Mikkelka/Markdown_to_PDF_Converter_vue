# 📝 Markdown til PDF Converter

En moderne Vue 3 webapplikation til at skrive markdown og eksportere til PDF med dansk understøttelse og Firebase integration.

![Vue 3](https://img.shields.io/badge/Vue.js-35495E?style=flat&logo=vue.js&logoColor=4FC08D)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=flat&logo=firebase&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-FFD93D?style=flat&logo=vue.js&logoColor=black)

## ✨ Features

- 📝 **Live Markdown Editor** - Real-time preview mens du skriver
- 📄 **PDF Export** - Eksporter til PDF med dansk formatering
- 🔐 **Google Authentication** - Sikker login med Firebase Auth
- ☁️ **Cloud Storage** - Dine dokumenter gemmes i Firestore
- 💾 **Auto-save** - Automatisk gem hver 30. sekund
- 📱 **Responsive Design** - Fungerer på desktop og mobile
- 🌙 **Dark Theme** - Elegant mørkt tema inspireret af GitHub
- 🎨 **Lucide Icons** - Moderne SVG ikoner
- 📡 **Offline Support** - localStorage fallback
- 🤖 **AI Integration** - Google Gemini AI til forbedring af markdown
- ⚡ **AI Toolbar** - Opsummer, forklar, forkort og forbedre tekst
- 🔧 **AI Settings** - Konfigurerbar Gemini API nøgle og model

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repository-url>
cd markdown_to_pdf_converter
npm install
```

### 2. Firebase Setup
1. Opret et [Firebase projekt](https://console.firebase.google.com)
2. Aktiver **Authentication** (Google provider)
3. Aktiver **Firestore Database**
4. Kopier Firebase config:

```bash
cp .env.example .env.local
```

Udfyld `.env.local` med dine Firebase credentials:
```env
VITE_FIREBASE_API_KEY=din-api-key
VITE_FIREBASE_AUTH_DOMAIN=dit-projekt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dit-projekt-id
VITE_FIREBASE_STORAGE_BUCKET=dit-projekt.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=din-app-id
```

### 3. Firestore Security Rules
Sæt følgende rules i Firebase Console under **Firestore Database > Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Start Development
```bash
npm run dev
```

Åbn [http://localhost:5173](http://localhost:5173) i din browser.

## 🏗️ Project Structure

```
src/
├── components/           # Vue komponenter
│   ├── AIToolbar.vue        # AI funktioner toolbar
│   ├── AuthHeader.vue       # Login/logout header
│   ├── DocumentSidebar.vue  # Dokumentliste
│   ├── GeminiSettingsModal.vue # AI indstillinger
│   ├── MarkdownEditor.vue   # Markdown input
│   ├── PreviewPanel.vue     # Live preview + PDF export
│   └── ProfileModal.vue     # Brugerindstillinger
├── composables/         # Vue composables
│   ├── useMarkdown.js   # Markdown processing
│   └── usePdfExport.js  # PDF generation
├── services/           # Backend services
│   ├── firebase.js     # Firebase config
│   └── firestore.js    # Database operations
├── stores/             # Pinia state management
│   ├── ai.js           # AI/Gemini state
│   ├── auth.js         # Authentication state
│   ├── documents.js    # Document management
│   └── editor.js       # Editor state
├── App.vue             # Main app component
├── main.js             # App entry point
└── style.css          # Global styles
```

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Check code quality with ESLint
npm run lint:fix # Auto-fix ESLint errors
```

## 📚 Tech Stack

### Core
- **[Vue 3](https://vuejs.org/)** - Progressive JavaScript framework
- **[Vite](https://vitejs.dev/)** - Fast build tool
- **[Pinia](https://pinia.vuejs.org/)** - State management

### UI & Styling
- **[Lucide Vue Next](https://lucide.dev/)** - Beautiful SVG icons
- **Custom CSS** - Dark theme inspired by GitHub

### Code Quality
- **[ESLint](https://eslint.org/)** - Code linting and formatting
- **[eslint-plugin-vue](https://eslint.vuejs.org/)** - Vue 3 specific linting rules

### Backend & Database
- **[Firebase](https://firebase.google.com/)** - Authentication & database
- **[Firestore](https://firebase.google.com/products/firestore)** - Cloud database
- **localStorage** - Offline backup

### Document Processing
- **[markdown-it](https://github.com/markdown-it/markdown-it)** - Markdown parser
- **[html2pdf.js](https://github.com/eKoopmans/html2pdf.js)** - PDF generation

### AI Integration
- **[Google Generative AI](https://ai.google.dev/)** - Gemini AI integration
- **AI Toolbar** - Opsummer, forklar, forkort og forbedre tekst
- **Konfigurerbar API** - Brugerdefineret Gemini API nøgle

## 🎯 Core Features

### 📝 Markdown Editor
- Real-time preview
- Syntax highlighting support
- Auto-save functionality
- Document title management

### 🔐 Authentication
- Google OAuth integration
- Secure user sessions
- Profile management
- Account deletion

### 📄 Document Management
- Create, read, update, delete documents
- Cloud synchronization
- Offline localStorage fallback
- Document history

### 📱 PDF Export
- Danish date formatting
- Print-optimized styling
- A4 format
- High-quality rendering

### 🤖 AI Features
- **Opsummer** - Lav kort sammendrag af tekst
- **Forklar** - Få detaljerede forklaringer
- **Forkort** - Gør tekst mere koncis
- **Forbedre** - Enhance tone og klarhed
- **Gemini API** - Konfigurerbar AI integration
- **Model Selection** - Vælg mellem forskellige Gemini modeller

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🔒 Security

- Firebase Authentication for secure login
- Firestore security rules for data protection
- User data isolation
- Environment variables for sensitive config

## 📖 Firebase Setup Guide

1. **Create Project**: Gå til [Firebase Console](https://console.firebase.google.com)
2. **Authentication**: 
   - Gå til Authentication > Sign-in method
   - Aktiver Google provider
3. **Firestore**:
   - Opret Firestore Database
   - Start i test mode
   - Opdater med security rules (se ovenfor)
4. **Web App**:
   - Tilføj web app til projekt
   - Kopier config til `.env.local`

## 🤝 Contributing

1. Fork projektet
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push til branch: `git push origin feature/amazing-feature`
5. Åbn Pull Request

## 📝 License

MIT License - se [LICENSE](LICENSE) fil for detaljer.

## 🙋‍♂️ Support

Har du spørgsmål eller problemer?
- 📧 Opret et [GitHub issue](../../issues)
- 📖 Læs [CLAUDE.md](CLAUDE.md) for udviklingsguide

---

**Bygget med ❤️ og Vue 3**
