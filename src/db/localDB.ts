import { PGlite } from '@electric-sql/pglite'
import { electricSync } from '@electric-sql/pglite-sync'
import { live } from '@electric-sql/pglite/live'
import schemaSQL from './schema.sql?raw'
import { api } from '@/api/client'
import { generatePubKey } from '@/utils/crypto'
import { PGliteWorker } from '@electric-sql/pglite/worker'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

export interface User {
  pub_key: string
  name: string
}

class LocalDB {
  private db!: any
  private syncEngine!: any
  private users: any
  private isOnline: boolean
  public isLocalStash: boolean

  constructor() {
    this.isOnline = navigator.onLine
    this.isLocalStash = false
  }

  get cachedUsers() {
    return this.users ? this.users : []
  }

  async init() {
    this.db = new PGliteWorker(
      new Worker(new URL('./pglite-worker.js?worker', import.meta.url), {
        type: 'module',
      }),
      {
        extensions: {
          live,
          electric: electricSync({
            metadataSchema: 'my_sync_metadata',
          }),
        },
      },
    )

    await this.db.exec(schemaSQL)

    await this.initSyncEngine()

    const stash = await this.getLocalUsers()

    this.isLocalStash = !!stash?.length

    this.syncEngine.stream.subscribe(() => {
      if (this.isLocalStash) {
        console.log('local send')

        setTimeout(this.sendLocalUsers, 3000)
      }
    })

    return this.db
  }

  get instance() {
    return this.db
  }

  async initSyncEngine() {
    const { setOffline } = useOnlineStatus()

    this.syncEngine = await this.db.electric.syncShapeToTable({
      shape: {
        url: new URL('/api/shapes/users', window.location.origin).toString(),
        params: {
          table: 'users',
        },
      },
      table: 'users_synced',
      primaryKey: ['pub_key'],
      shapeKey: null, //'pub_key',
      onError: (error: any) => {
        console.error('Shape sync error', error)

        setOffline()
      },
    })
  }

  async getUsers(): Promise<any> {
    const result = await this.db.query(`SELECT * from users;`)

    return result.rows
  }

  async getLocalUsers(): Promise<any> {
    const result = await this.db.query(`SELECT * from users_local;`)

    return result.rows
  }

  async addLocalUser(name: string) {
    const pub_key = await generatePubKey()

    await this.db.query(`INSERT INTO users_local (pub_key, name) VALUES ($1, $2)`, [pub_key, name])

    this.isLocalStash = true

    await this.sendLocalUsers()
  }

  async sendLocalUsers() {
    if (!navigator.onLine) return

    const mutations = await localDB.getLocalUsers()

    if (!mutations.length) {
      this.isLocalStash = false

      return
    }

    try {
      await api.ingest(
        mutations.map((m: User) => ({
          type: 'insert',
          modified: { pub_key: m.pub_key, name: m.name },
          syncMetadata: {
            relation: 'users',
          },
        })),
      )
    } catch (err) {
      console.warn('Sync failed, will retry later', err)
    }
  }
}

export const localDB = new LocalDB()
