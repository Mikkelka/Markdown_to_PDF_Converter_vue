<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()

// Props and emits
defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// Local state
const profileName = ref('')
const profileEmail = ref('')
const geminiApiKey = ref('')
const isVisible = ref(false)

// Computed properties
const currentUser = computed(() => authStore.currentUser)

// Watch for user changes to populate form
watch(currentUser, (user) => {
  if (user) {
    profileName.value = user.name || ''
    profileEmail.value = user.email || ''
    geminiApiKey.value = user.geminiApiKey || ''
  }
}, { immediate: true })

// Methods
async function saveProfile() {
  try {
    await authStore.updateProfile({
      name: profileName.value.trim(),
      geminiApiKey: geminiApiKey.value.trim()
    })
    
    showSuccess('Profil opdateret!')
  } catch (error) {
    showError(error.message || 'Kunne ikke opdatere profil')
  }
}

async function deleteAccount() {
  const confirmed = confirm('Er du sikker på at du vil slette din konto permanent? Dette kan ikke fortrydes.')
  
  if (confirmed) {
    try {
      await authStore.deleteAccount()
      emit('close')
      showSuccess('Konto slettet')
    } catch (error) {
      showError(error.message || 'Kunne ikke slette konto')
    }
  }
}

function closeModal() {
  emit('close')
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
</script>

<template>
  <div class="modal-body">
    <!-- User Information Section -->
    <div class="profile-section">
      <h3>Brugeroplysninger</h3>
      
      <div class="form-group">
        <label for="profileName">Navn</label>
        <input 
          id="profileName"
          v-model="profileName"
          type="text" 
          placeholder="Dit navn"
        >
      </div>
      
      <div class="form-group">
        <label for="profileEmail">Email</label>
        <input 
          id="profileEmail"
          v-model="profileEmail"
          type="email" 
          readonly
          class="readonly-input"
        >
      </div>
      
      <button @click="saveProfile" class="auth-btn">
        Gem profil
      </button>
    </div>

    <!-- API Settings Section -->
    <div class="profile-section">
      <h3>API Indstillinger</h3>
      
      <div class="form-group">
        <label for="geminiApiKey">Gemini API Nøgle</label>
        <input 
          id="geminiApiKey"
          v-model="geminiApiKey"
          type="password" 
          placeholder="Til fremtidig brug..."
        >
        <small class="form-help">
          Din API nøgle gemmes lokalt og bruges til fremtidige funktioner
        </small>
      </div>
    </div>

    <!-- Danger Zone Section -->
    <div class="profile-section danger-section">
      <h3>Farezone</h3>
      <p>Dette vil permanent slette din konto og alle dine dokumenter.</p>
      <button @click="deleteAccount" class="danger-btn">
        Slet konto
      </button>
    </div>
  </div>
</template>

<style scoped>
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
}

.profile-section {
  margin-bottom: 2rem;
}

.profile-section:last-child {
  margin-bottom: 0;
}

.profile-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #E6EDF3;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #30363D;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #E6EDF3;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  background: #161B22;
  border: 1px solid #30363D;
  border-radius: 6px;
  padding: 0.75rem;
  color: #E6EDF3;
  font-size: 0.875rem;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #1F6FEB;
  box-shadow: 0 0 0 2px rgba(31, 111, 235, 0.3);
}

.form-group input.readonly-input {
  background: #0D1117;
  color: #8B949E;
  cursor: not-allowed;
}

.form-group input::placeholder {
  color: #8B949E;
}

.form-help {
  display: block;
  font-size: 0.75rem;
  color: #8B949E;
  margin-top: 0.375rem;
  line-height: 1.4;
}

.auth-btn {
  background: #238636;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.auth-btn:hover {
  background: #2EA043;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(35, 134, 54, 0.3);
}

.danger-section {
  border-top: 1px solid #30363D;
  padding-top: 1.5rem;
}

.danger-section h3 {
  color: #F85149;
  border-bottom-color: rgba(248, 81, 73, 0.3);
}

.danger-section p {
  font-size: 0.875rem;
  color: #8B949E;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.danger-btn {
  background: #DA3633;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.danger-btn:hover {
  background: #F85149;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(248, 81, 73, 0.3);
}

/* Scrollbar styling */
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #30363D;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #484F58;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .modal-body {
    padding: 1rem;
  }
  
  .profile-section {
    margin-bottom: 1.5rem;
  }
  
  .auth-btn,
  .danger-btn {
    width: 100%;
  }
}
</style>