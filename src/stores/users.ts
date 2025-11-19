import { defineStore } from 'pinia'
import { onMounted } from 'vue'

import { localDB } from '@/db/localDB'

export const useUsersStore = defineStore('users', () => {
  onMounted(async () => {
    window.addEventListener('online', async () => await localDB.sendLocalUsers())
  })

  const addUser = async (name: string) => {
    await localDB.addLocalUser(name)
  }

  return {
    addUser: (name: string) => addUser(name),
  }
})
