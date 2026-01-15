<template>
  <div :class="['theme-wrapper', currentTheme]">
    <LoginView 
      v-if="!isLoggedIn" 
      :theme="currentTheme"
      @login-success="handleLoginSuccess" 
      @toggle-theme="toggleTheme"
    />
    <div v-else class="app-wrapper">
      <Home 
        :session="userSession" 
        :theme="currentTheme"
        @logout="handleLogout"
        @toggle-theme="toggleTheme"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Home from './components/home.vue'
import LoginView from './components/LoginView.vue'

const isLoggedIn = ref(false)
const userSession = ref(null)
const currentTheme = ref('light') // Default to light

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('pathdb_theme', currentTheme.value)
}

const handleLoginSuccess = (sessionData) => {
  isLoggedIn.value = true
  userSession.value = sessionData
  localStorage.setItem('pathdb_session', JSON.stringify({
    ...sessionData,
    timestamp: Date.now()
  }))
}

const handleLogout = () => {
  isLoggedIn.value = false
  userSession.value = null
  localStorage.removeItem('pathdb_session')
}

onMounted(() => {
  // Load session
  const savedSession = localStorage.getItem('pathdb_session')
  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession)
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        isLoggedIn.value = true
        userSession.value = parsed
      } else {
        localStorage.removeItem('pathdb_session')
      }
    } catch (e) {
      localStorage.removeItem('pathdb_session')
    }
  }

  // Load theme
  const savedTheme = localStorage.getItem('pathdb_theme')
  if (savedTheme) {
    currentTheme.value = savedTheme
  }
  
  if (window.lucide) window.lucide.createIcons()
})

// Update document body for global CSS variables if needed
watch(currentTheme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme)
}, { immediate: true })

</script>

<style>
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
}

[data-theme='dark'] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border-color: #334155;
}

.theme-wrapper {
  width: 100vw;
  height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

.app-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
