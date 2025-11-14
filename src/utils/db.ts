import { openDB, type IDBPDatabase } from 'idb'

interface Mutation {
  id: string
  pub_key: string
  name: string
  timestamp: number
}

export interface User {
  pub_key: string
  name: string
}

class LocalDB {
  private db!: IDBPDatabase

  async init() {
    this.db = await openDB('phoenix-sync', 1, {
      upgrade(db) {
        db.createObjectStore('mutations', { keyPath: 'id' })

        db.createObjectStore('cache')
      },
    })
  }

  async queueMutation(mutation: Omit<Mutation, 'id' | 'timestamp'>) {
    const id = crypto.randomUUID()

    await this.db.put('mutations', { ...mutation, id, timestamp: Date.now() })
  }

  async getPendingMutations(): Promise<Mutation[]> {
    return (await this.db.getAll('mutations')).sort((a, b) => a.timestamp - b.timestamp)
  }

  async deleteMutation(id: string) {
    await this.db.delete('mutations', id)
  }

  async cacheUsers(users: User[]) {
    await this.db.put('cache', { users, timestamp: Date.now() }, 'users')
  }

  async getCachedUsers(): Promise<User[] | null> {
    const cache = await this.db.get('cache', 'users')

    return cache?.users ?? null
  }
}

export const localDB = new LocalDB()
