import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const username = ref(localStorage.getItem('username') || '')
  const token = ref(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value)

  function login(user, tokenValue) {
    username.value = user
    token.value = tokenValue
    localStorage.setItem('username', user)
    localStorage.setItem('token', tokenValue)
  }

  function logout() {
    username.value = ''
    token.value = ''
    localStorage.removeItem('username')
    localStorage.removeItem('token')
  }

  return {
    username,
    token,
    isLoggedIn,
    login,
    logout
  }
})
