/**
 * Завантажує фото зі старого сайту climbing.kharkov.ua у public/legacy,
 * щоб новий сайт не залежав від старого.
 *
 *   npm run media:sync
 *
 * Після цього створіть файл .env з рядком:  VITE_MEDIA_BASE=/legacy
 */
import { mkdir, writeFile, access, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'legacy')
const BASE = 'https://www.climbing.kharkov.ua'

// Збираємо всі шляхи /images/... з файлів контенту
const sources = ['src/content/site.ts', 'src/content/events.ts', 'src/content/gallery.ts']
const paths = new Set()
for (const f of sources) {
  const text = await readFile(join(ROOT, f), 'utf8')
  for (const m of text.matchAll(/'(\/images\/[^']+)'/g)) paths.add(m[1])
}
// Фото галереї будуються з папки + імені файлу
const gallery = await readFile(join(ROOT, 'src/content/gallery.ts'), 'utf8')
for (const m of gallery.matchAll(/dir: '([^']*)', files: \[([^\]]+)\]/g)) {
  for (const f of m[2].matchAll(/'([^']+)'/g)) paths.add(`/images/phocagallery/${m[1]}thumbs/phoca_thumb_l_${f[1]}`)
}

let ok = 0, skip = 0, fail = 0
for (const p of paths) {
  const target = join(OUT, p)
  try { await access(target); skip++; continue } catch { /* ще немає */ }
  try {
    const res = await fetch(BASE + encodeURI(p))
    if (!res.ok) throw new Error(String(res.status))
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, Buffer.from(await res.arrayBuffer()))
    ok++
    process.stdout.write('.')
  } catch (e) {
    fail++
    console.warn(`\n✗ ${p}: ${e.message}`)
  }
}
console.log(`\nГотово: завантажено ${ok}, вже були ${skip}, помилок ${fail}.`)
console.log('Додайте в .env:  VITE_MEDIA_BASE=/legacy')
