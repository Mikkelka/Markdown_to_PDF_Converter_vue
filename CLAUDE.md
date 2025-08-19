# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Vue 3 + Vite** project for a Markdown to PDF converter application. The project is currently in a **migration phase** - transitioning from a vanilla JavaScript implementation (located in `old_site/`) to a modern Vue 3 application.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Architecture

### Current State
- **Framework**: Vue 3 with Composition API (`<script setup>`)
- **Build Tool**: Vite
- **Current Status**: Basic Vue 3 scaffold (mostly empty, needs implementation)

### Legacy Implementation (`old_site/Markdown_til_PDF_Converter/`)
The previous working implementation contains:

#### Core Features
- **Markdown Editor**: Real-time markdown editing with live preview
- **PDF Generation**: Uses `html2pdf.js` with Danish localization and custom styling
- **Document Management**: Full CRUD operations for markdown documents
- **User Authentication**: Firebase Authentication with Google sign-in
- **Data Persistence**: Firebase Firestore with localStorage fallback
- **Auto-save**: Automatic document saving every 30 seconds
- **Responsive UI**: Sidebar document list, toggleable preview

#### Key Components Structure
- `script.js` - Main `MarkdownToPDFConverter` class (830+ lines)
- `firebase-auth-manager.js` - `FirebaseAuthManager` class for authentication
- `styles.css` - Complete styling including dark theme
- `index.html` - Full UI structure with Firebase integration

#### Firebase Integration
- **Authentication**: Google OAuth, email/password, profile management
- **Firestore**: Document storage with user isolation (`userId` field)
- **Offline Support**: localStorage fallback when Firebase unavailable
- **Security**: User documents are properly scoped and protected

#### PDF Generation Features
- Custom Danish date formatting
- Print-optimized styling (white background, readable fonts)
- Proper handling of code blocks, tables, blockquotes
- A4 format with optimized margins
- High-quality image rendering

## Migration Notes

When implementing features in Vue 3:

1. **Component Architecture**: Break down the monolithic `MarkdownToPDFConverter` class into Vue components:
   - `MarkdownEditor.vue` - Main editor component
   - `DocumentPreview.vue` - Preview component
   - `DocumentSidebar.vue` - Document list sidebar
   - `AuthenticatedUser.vue` - User authentication UI
   - `ProfileModal.vue` - User profile management

2. **State Management**: Consider using Pinia or Vue 3 reactive refs for:
   - Current document state
   - User authentication state
   - Document list management
   - UI state (sidebar open/closed, etc.)

3. **Firebase Integration**: 
   - Use Firebase v9+ modular SDK
   - Implement proper TypeScript types if adding TS
   - Maintain the existing Firestore document structure for compatibility

4. **Dependencies to Add**:
   - `firebase` - For authentication and Firestore
   - `markdown-it` - Markdown parsing
   - `html2pdf.js` - PDF generation
   - Consider `@vueuse/core` for composables

## Key Implementation Patterns

### Authentication Flow
The legacy implementation uses Firebase Auth with automatic state listening and UI updates. Key methods:
- `onUserLogin()` - Loads user documents and updates UI
- `onUserLogout()` - Clears state and shows login UI
- `updateAuthUI()` - Updates header based on auth state

### Document Management
- Documents are stored with `userId`, `title`, `content`, `createdAt`, `updatedAt`
- Real-time auto-save every 30 seconds for logged-in users
- Optimistic UI updates with Firestore sync
- Graceful fallback to localStorage when offline

### PDF Generation
Critical styling requirements for PDF output:
- Force white background and dark text for print compatibility
- Handle code blocks with light gray background
- Proper table styling with borders
- Danish date formatting: `dd/MM/yyyy HH:mm`
- A4 format with 8mm margins

## Danish Language Support
The application is localized in Danish:
- UI text and messages are in Danish
- Date formatting uses Danish locale (`da-DK`)
- Error messages and confirmations in Danish
- Document titles default to "Untitled Document" equivalent

## Firebase Configuration
The app uses environment variables for Firebase configuration:

1. **Copy the example file:**
```bash
cp .env.example .env.local
```

2. **Replace with your Firebase config values in `.env.local`:**
```env
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-actual-app-id
```

**Required Firebase services:**
- Authentication (Google provider enabled)
- Firestore Database  
- Proper security rules for user document isolation

**Note:** The app runs in demo mode without valid Firebase config (login will not work but markdown editing and PDF export still function).