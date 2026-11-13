/**
 * Локальна заміна @netlify/blobs для `npm run dev`.
 * Дані зберігаються у файлах .netlify/dev-blobs/<сховище>.json (папка не потрапляє в git).
 * На Netlify використовується справжнє сховище — цей файл туди не потрапляє.
 */
import fs from 'node:fs'
import path from 'node:path'

const DIR = path.resolve('.netlify/dev-blobs')
let seq = Date.now()

function file(name) {
  return path.join(DIR, `${name.replace(/[^\w-]/g, '_')}.json`)
}
function read(name) {
  try {
    return JSON.parse(fs.readFileSync(file(name), 'utf8'))
  } catch {
    return {}
  }
}
function write(name, data) {
  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(file(name), JSON.stringify(data, null, 1))
}

export function getStore(opts) {
  const name = typeof opts === 'string' ? opts : opts.name
  const parse = (entry, type) => (type === 'json' ? JSON.parse(entry.body) : entry.body)
  return {
    async get(key, o = {}) {
      const e = read(name)[key]
      return e ? parse(e, o.type) : null
    },
    async getWithMetadata(key, o = {}) {
      const e = read(name)[key]
      return e ? { data: parse(e, o.type), etag: e.etag, metadata: {} } : null
    },
    async set(key, value, o = {}) {
      return this._put(key, String(value), o)
    },
    async setJSON(key, value, o = {}) {
      return this._put(key, JSON.stringify(value), o)
    },
    async _put(key, body, o) {
      const all = read(name)
      const cur = all[key]
      if (o.onlyIfMatch && (!cur || cur.etag !== o.onlyIfMatch)) return { modified: false }
      if (o.onlyIfNew && cur) return { modified: false }
      const etag = `"${(++seq).toString(36)}"`
      all[key] = { body, etag }
      write(name, all)
      return { modified: true, etag }
    },
    async delete(key) {
      const all = read(name)
      delete all[key]
      write(name, all)
    },
    async list({ prefix = '' } = {}) {
      const all = read(name)
      return { blobs: Object.keys(all).filter((k) => k.startsWith(prefix)).map((key) => ({ key, etag: all[key].etag })), directories: [] }
    },
  }
}
