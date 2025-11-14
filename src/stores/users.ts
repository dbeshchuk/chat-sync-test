import { defineStore } from 'pinia'
import { ref, computed, onMounted, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { generatePubKey } from '@/utils/crypto'
import { localDB, type User } from '@/utils/db'

export const useUsersStore = defineStore('users', () => {
  const filter = ref('')
  const queryClient = useQueryClient()
  const pendingMutations = ref<User[]>([])

  onMounted(async () => {
    await localDB.init()

    const cached = await localDB.getCachedUsers()

    if (cached) {
      queryClient.setQueryData(['users', filter.value], cached)
    }

    const mutations = await localDB.getPendingMutations()

    pendingMutations.value = mutations.map((m) => ({
      pub_key: m.pub_key,
      name: m.name,
    }))

    flushQueue()

    window.addEventListener('online', flushQueue)
  })

  const { data: serverUsers, isLoading } = useQuery({
    queryKey: ['users', filter.value],
    queryFn: () => api.getUsers(filter.value),
    refetchInterval: 5000,
  })

  watch(
    serverUsers,
    async (newData) => {
      if (newData) {
        await localDB.cacheUsers(newData)
      }
    },
    { immediate: true },
  )

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const pub_key = await generatePubKey()
      await localDB.queueMutation({ pub_key, name })
      return { pub_key, name }
    },

    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ['users'] })

      const tempId = `temp-${Date.now()}`
      const tempUser = { pub_key: tempId, name }

      // queryClient.setQueryData(['users', filter.value], (old: User[] = []) => [...old, tempUser])

      pendingMutations.value = [...pendingMutations.value, tempUser]

      return { tempId, tempUser }
    },

    onError: (err, name, context: any) => {
      // queryClient.setQueryData(['users', filter.value], (old: User[] = []) =>
      //   old.filter((u) => u.pub_key !== context.tempId),
      // )

      pendingMutations.value = pendingMutations.value.filter((u) => u.pub_key !== context.tempId)

      console.error('Failed to add user locally', err)
    },

    onSuccess: (data, name, context: any) => {
      pendingMutations.value = pendingMutations.value.map((u) =>
        u.pub_key === context.tempId ? { ...u, pub_key: data.pub_key } : u,
      )

      flushQueue()
    },
  })

  const flushQueue = async () => {
    if (!navigator.onLine) return

    const mutations = await localDB.getPendingMutations()

    if (!mutations.length) return

    try {
      await api.ingest(
        mutations.map((m) => ({
          type: 'insert',
          modified: { pub_key: m.pub_key, name: m.name },
          syncMetadata: {
            relation: 'users',
          },
        })),
      )

      await Promise.all(mutations.map((m) => localDB.deleteMutation(m.id)))

      queryClient.invalidateQueries({ queryKey: ['users'] })

      pendingMutations.value = pendingMutations.value.filter(
        (pm) => !mutations.some((m) => m.pub_key === pm.pub_key),
      )
    } catch (err) {
      console.warn('Sync failed, will retry later', err)
    }
  }

  const users = computed(() => {
    const serverData = serverUsers.value || []

    console.log('lists', serverData, pendingMutations.value)

    const allUsers = [...serverData, ...pendingMutations.value]

    const uniqueMap = new Map<string, User>()

    allUsers.forEach((u) => {
      if (!uniqueMap.has(u.pub_key)) {
        uniqueMap.set(u.pub_key, u)
      }
    })

    const result = Array.from(uniqueMap.values())

    return filter.value
      ? result.filter((user) => user.name.toLowerCase().includes(filter.value.toLowerCase()))
      : result
  })

  return {
    users,
    isLoading,
    filter,
    addUser: (name: string) => addMutation.mutate(name),
    flushQueue,
    isPending: computed(() => pendingMutations.value.length > 0),
  }
})
