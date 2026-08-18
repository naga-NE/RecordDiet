import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const targets = ['src', 'index.html']
const externalUrl = /https?:\/\//i
const allow = new Set(['src/lib/networkLockdown.ts'])
const forbiddenRuntime = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/
let failed = false

async function files(path) {
  const stat = await import('node:fs/promises').then(fs => fs.stat(path))
  if (stat.isFile()) return [path]
  const entries = await readdir(path, { withFileTypes: true })
  const nested = await Promise.all(entries.map(e => files(join(path, e.name))))
  return nested.flat()
}

for (const target of targets) {
  for (const file of await files(join(root, target))) {
    if (!['.ts', '.tsx', '.js', '.mjs', '.html'].includes(extname(file))) continue
    const rel = relative(root, file).replaceAll('\\', '/')
    const text = await readFile(file, 'utf8')
    if (externalUrl.test(text)) {
      console.error(`External URL found in runtime source: ${rel}`)
      failed = true
    }
    if (!allow.has(rel) && forbiddenRuntime.test(text)) {
      console.error(`Network primitive found outside lockdown module: ${rel}`)
      failed = true
    }
  }
}

if (failed) process.exit(1)
console.log('Runtime network scan passed: no external URLs or network primitives outside the lockdown module.')
