const API_BASE = 'http://buckitup.xyz:4403'

export const api = {
  getUsers: (filter?: string) => {
    const params = new URLSearchParams('offset=-1')

    if (filter) params.append('where', `name ILIKE '%${filter}%'`)

    return fetch(`${API_BASE}/shapes/users?offset=-1`).then((r) => r.json())
  },

  ingest: (mutations: any[]) => {
    return fetch(`${API_BASE}/ingest/mutations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mutations }),
    })
  },
}
