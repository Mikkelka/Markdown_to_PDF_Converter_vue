<script setup>
import { ref, computed } from 'vue'
import { User, Settings, LogOut, ChevronDown, X } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.js'
import { useEditorStore } from '../stores/editor.js'
import ProfileModal from './ProfileModal.vue'
import GeminiSettingsModal from './GeminiSettingsModal.vue'

const authStore = useAuthStore()
const editorStore = useEditorStore()

// Local state
const showLoginMenu = ref(false)
const showUserMenu = ref(false)
const showProfileModal = ref(false)
const showGeminiSettingsModal = ref(false)

// Computed properties
const isLoggedIn = computed(() => authStore.isLoggedIn)
const currentUser = computed(() => authStore.currentUser)

// Methods

function toggleLoginMenu() {
  showLoginMenu.value = !showLoginMenu.value
  showUserMenu.value = false
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
  showLoginMenu.value = false
}

function closeMenus() {
  showLoginMenu.value = false
  showUserMenu.value = false
}

async function signInWithGoogle() {
  if (authStore.loading) return
  
  try {
    await authStore.signInWithGoogle()
    closeMenus()
    showSuccess('Logget ind med Google!')
  } catch (error) {
    showError(error.message || 'Login fejlede')
  }
}

async function logout() {
  try {
    await authStore.logout()
    closeMenus()
    showSuccess('Du er nu logget ud')
  } catch (error) {
    showError('Logout fejlede')
  }
}

function openProfileModal() {
  if (!isLoggedIn.value) return
  showProfileModal.value = true
  closeMenus()
}

function closeProfileModal() {
  showProfileModal.value = false
}

function openGeminiSettingsModal() {
  if (!isLoggedIn.value) return
  showGeminiSettingsModal.value = true
  showProfileModal.value = false
  closeMenus()
}

function closeGeminiSettingsModal() {
  showGeminiSettingsModal.value = false
}

function handleOpenGeminiSettings() {
  openGeminiSettingsModal()
}

// Notification helpers
function showSuccess(message) {
  showNotification(message, 'success')
}

function showError(message) {
  showNotification(message, 'error')
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div')
  notification.textContent = message
  
  const colors = {
    success: { bg: '#238636', text: 'white' },
    error: { bg: '#F85149', text: 'white' }
  }
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type].bg};
    color: ${colors[type].text};
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    z-index: 2001;
    opacity: 0;
    transition: opacity 0.3s ease;
    max-width: 300px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  `
  
  document.body.appendChild(notification)
  
  setTimeout(() => notification.style.opacity = '1', 100)
  
  setTimeout(() => {
    notification.style.opacity = '0'
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
  const loginMenu = e.target.closest('.login-menu')
  const userMenu = e.target.closest('.user-menu')
  
  if (!loginMenu && !userMenu) {
    closeMenus()
  }
})
</script>

<template>
  <header class="header">
    <h1>Markdown til PDF Converter</h1>
    
    <div class="header-actions">
      <!-- User Menu (when logged in) -->
      <div v-if="isLoggedIn" class="user-menu">
        <button @click="toggleUserMenu" class="user-menu-btn">
          <img 
            v-if="currentUser?.photoURL" 
            :src="currentUser.photoURL" 
            alt="Profilbillede"
            class="profile-img"
          >
          <User :size="16" v-if="!currentUser?.photoURL" />
          <span class="user-name">{{ currentUser?.name || currentUser?.email }}</span>
          <ChevronDown :size="14" class="dropdown-arrow" />
        </button>
        
        <div 
          class="user-dropdown" 
          :class="{ open: showUserMenu }"
          @click.stop
        >
          <button @click="openProfileModal" class="dropdown-item">
            <Settings :size="16" />
            Profil & Indstillinger
          </button>
          <div class="dropdown-separator"></div>
          <button @click="logout" class="dropdown-item logout">
            <LogOut :size="16" />
            Log ud
          </button>
        </div>
      </div>

      <!-- Login Menu (when not logged in) -->
      <div v-else class="login-menu">
        <button @click="toggleLoginMenu" class="login-btn">Log ind</button>
        
        <div 
          class="login-dropdown"
          :class="{ open: showLoginMenu }"
          @click.stop
        >
          <button 
            @click="signInWithGoogle" 
            class="google-signin-btn"
            :disabled="authStore.loading"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51,8.18c0-0.57-0.05-1.13-0.14-1.67H9.18v3.16h4.11c-0.18,0.95-0.71,1.76-1.51,2.37v1.96h2.45C15.38,12.69,16.51,10.66,16.51,8.18L16.51,8.18z"/>
              <path fill="#34A853" d="M9.18,16.5c2.04,0,3.75-0.67,5-1.82l-2.45-1.96c-0.67,0.45-1.53,0.72-2.55,0.72c-1.96,0-3.62-1.32-4.22-3.1H2.49v2.02C3.73,14.73,6.26,16.5,9.18,16.5L9.18,16.5z"/>
              <path fill="#FBBC05" d="M4.96,10.34c-0.15-0.45-0.24-0.94-0.24-1.44s0.08-0.99,0.24-1.44V5.44H2.49C1.83,6.77,1.5,8.31,1.5,9.9s0.33,3.13,0.99,4.46L4.96,10.34L4.96,10.34z"/>
              <path fill="#EA4335" d="M9.18,3.50c1.11,0,2.1,0.38,2.89,1.13l2.17-2.17C12.92,1.19,11.21,0.5,9.18,0.5C6.26,0.5,3.73,2.27,2.49,4.64l2.47,2.02C5.56,4.88,7.22,3.50,9.18,3.50L9.18,3.50z"/>
            </svg>
            <span>{{ authStore.loading ? 'Logger ind...' : 'Fortsæt med Google' }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Profile Modal -->
    <div v-if="showProfileModal && isLoggedIn" class="modal-backdrop" @click="closeProfileModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Profil & Indstillinger</h2>
          <button @click="closeProfileModal" class="close-btn">
            <X :size="20" />
          </button>
        </div>
        <ProfileModal 
          @close="closeProfileModal" 
          @open-gemini-settings="handleOpenGeminiSettings"
        />
      </div>
    </div>

    <!-- Gemini Settings Modal -->
    <GeminiSettingsModal 
      v-if="showGeminiSettingsModal && isLoggedIn"
      @close="closeGeminiSettingsModal"
    />
  </header>
</template>

<style scoped>
.header {
  background: #161B22;
  border-bottom: 1px solid #30363D;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header h1 {
  flex: 1;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #E6EDF3;
  letter-spacing: -0.02em;
  text-align: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Login Menu Styles */
.login-menu {
  position: relative;
}

.login-btn {
  background: #238636;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.login-btn:hover {
  background: #2EA043;
}

.login-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: #21262D;
  border: 1px solid #30363D;
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s ease;
  z-index: 1000;
  min-width: 220px;
}

.login-dropdown.open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.google-signin-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  background: white;
  color: #1A1A1A;
  border: 1px solid #E5E7EB;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.google-signin-btn:hover:not(:disabled) {
  background: #F9FAFB;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.google-signin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* User Menu Styles */
.user-menu {
  position: relative;
}

.user-menu-btn {
  background: transparent;
  border: 1px solid #30363D;
  color: #E6EDF3;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.user-menu-btn:hover {
  background: #21262D;
  border-color: #484F58;
}

.profile-img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  font-size: 0.75rem;
  opacity: 0.7;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: #21262D;
  border: 1px solid #30363D;
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s ease;
  z-index: 1000;
  min-width: 200px;
}

.user-dropdown.open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  background: transparent;
  color: #E6EDF3;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  text-align: left;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: #30363D;
}

.dropdown-item.logout {
  color: #F85149;
}

.dropdown-item.logout:hover {
  background: rgba(248, 81, 73, 0.1);
}

.dropdown-separator {
  height: 1px;
  background: #30363D;
  margin: 0.5rem 0;
}

/* Modal Styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #21262D;
  border: 1px solid #30363D;
  border-radius: 12px;
  max-width: 500px;
  width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 64px rgba(0, 0, 0, 0.6);
}

.modal-header {
  background: #161B22;
  border-bottom: 1px solid #30363D;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #E6EDF3;
}

.close-btn {
  background: transparent;
  border: none;
  color: #8B949E;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #30363D;
  color: #E6EDF3;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .header {
    padding: 0.75rem;
  }
  
  .header h1 {
    font-size: 1rem;
  }
  
  .user-name {
    max-width: 80px;
  }
  
  .login-dropdown,
  .user-dropdown {
    right: -1rem;
  }
  
  .modal-content {
    width: 95vw;
    margin: 1rem;
  }
  
  .modal-header {
    padding: 1rem;
  }
}
</style>