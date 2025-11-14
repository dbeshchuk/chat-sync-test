<script setup lang="ts">
import { useUsersStore } from '@/stores/users'
import InternetIndicator from './InternetIndicator.vue'
import { ref } from 'vue'

const store = useUsersStore()

const name = ref('')

const add = () => {
  if (name.value.trim()) {
    store.addUser(name.value.trim())
    name.value = ''
  }
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto">
    <div class="flex align-center mb-6 w-full justify-between">
      <h1 class="text-2xl font-bold ">Local-First Registry</h1>

      <InternetIndicator />
    </div>


    <input v-model="store.filter" placeholder="Filter" class="border p-3 w-full mb-4 rounded" />

    <div v-if="store.isLoading" class="text-gray-500">Loading...</div>

    <ul class="space-y-3 mb-6">
      <li v-for="user in store.users" :key="user.pub_key" class="p-4 border rounded bg-gray-50">
        <div class="font-medium">{{ user.name }}</div>
        <div class="text-xs text-gray-500 font-mono">{{ user.pub_key }}</div>
      </li>
    </ul>

    <div class="flex gap-2 ">
      <input v-model="name" placeholder="Name" class="border p-3 flex-1 rounded" />

      <button @click="add" class="bg-green-600 text-white px-6 py-3 rounded font-semibold">
        Add
      </button>
    </div>
  </div>
</template>