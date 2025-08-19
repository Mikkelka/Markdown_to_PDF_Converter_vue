// Authentication store using Pinia
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  deleteUser
} from 'firebase/auth'
import { auth, isValidConfig } from '../services/firebase.js'

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref(null)
  const isInitialized = ref(false)
  const loading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!currentUser.value)

  // Actions
  async function initAuth() {
    if (!auth) {
      console.warn('Firebase Auth not initialized')
      isInitialized.value = true
      return Promise.resolve()
    }
    
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          currentUser.value = {
            id: user.uid,
            email: user.email,
            name: user.displayName || '',
            emailVerified: user.emailVerified,
            photoURL: user.photoURL || '',
            geminiApiKey: '',
            settings: { theme: 'dark', autoSave: true },
            provider: user.providerData[0]?.providerId === 'google.com' ? 'google' : 'email'
          }
          
          // Load additional user data from localStorage or other source
          await loadUserProfile()
        } else {
          currentUser.value = null
        }
        
        if (!isInitialized.value) {
          isInitialized.value = true
          resolve()
        }
      })
      
      // Also check for redirect result
      handleRedirectResult()
    })
  }

  async function handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth)
      if (result && result.user) {
        console.warn('User returned from Google redirect')
        // User data will be handled by onAuthStateChanged
      }
    } catch (error) {
      console.error('Error handling redirect result:', error)
    }
  }

  async function signInWithGoogle() {
    if (!auth || !isValidConfig) {
      throw new Error('Firebase er ikke konfigureret. Opret en .env.local fil med dine Firebase credentials.')
    }
    
    loading.value = true
    try {
      const provider = new GoogleAuthProvider()
      
      // Try popup first, fallback to redirect
      try {
        const result = await signInWithPopup(auth, provider)
        return result
      } catch (popupError) {
        // If popup fails, use redirect
        if (popupError.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider)
          return null // Will redirect, no result returned
        }
        throw popupError
      }
    } catch (error) {
      console.error('Google sign-in error:', error)
      
      // Provide user-friendly error messages
      if (error.code === 'auth/api-key-not-valid') {
        throw new Error('Firebase API nøgle er ikke gyldig. Tjek din .env.local konfiguration.')
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (!auth) {
      currentUser.value = null
      return
    }
    
    try {
      await signOut(auth)
      currentUser.value = null
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  async function updateProfile(profileData) {
    if (!currentUser.value) throw new Error('No user logged in')
    
    try {
      // Update Firebase profile
      if (profileData.name) {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: profileData.name
        })
      }
      
      // Update local user data
      currentUser.value = {
        ...currentUser.value,
        ...profileData
      }
      
      // Save to localStorage for persistence
      saveUserProfile()
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  async function deleteAccount() {
    if (!currentUser.value) throw new Error('No user logged in')
    
    try {
      await deleteUser(auth.currentUser)
      currentUser.value = null
      
      // Clear localStorage
      const userStorageKey = `userProfile_${currentUser.value.id}`
      localStorage.removeItem(userStorageKey)
    } catch (error) {
      console.error('Account deletion error:', error)
      throw error
    }
  }

  async function loadUserProfile() {
    if (!currentUser.value) return
    
    try {
      const userStorageKey = `userProfile_${currentUser.value.id}`
      const saved = localStorage.getItem(userStorageKey)
      
      if (saved) {
        const profileData = JSON.parse(saved)
        currentUser.value = {
          ...currentUser.value,
          ...profileData
        }
      }
    } catch (error) {
      console.warn('Failed to load user profile from localStorage:', error)
    }
  }

  function saveUserProfile() {
    if (!currentUser.value) return
    
    try {
      const userStorageKey = `userProfile_${currentUser.value.id}`
      const profileData = {
        geminiApiKey: currentUser.value.geminiApiKey || '',
        settings: currentUser.value.settings || { theme: 'dark', autoSave: true }
      }
      localStorage.setItem(userStorageKey, JSON.stringify(profileData))
    } catch (error) {
      console.warn('Failed to save user profile to localStorage:', error)
    }
  }

  return {
    // State
    currentUser,
    isInitialized,
    loading,
    
    // Getters
    isLoggedIn,
    
    // Actions
    initAuth,
    signInWithGoogle,
    logout,
    updateProfile,
    deleteAccount,
    loadUserProfile,
    saveUserProfile
  }
})