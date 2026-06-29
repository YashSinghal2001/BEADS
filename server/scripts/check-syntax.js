import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', 'src')

function walk(dir) {
  let files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) files = files.concat(walk(full))
    else if (extname(full) === '.js') files.push(full)
  }
  return files
}

const files = walk(ROOT)
let failed = 0

for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
  } catch (err) {
    failed++
    console.error(`✗ ${file}\n${err.stderr?.toString() || err.message}`)
  }
}

if (failed === 0) {
  console.log(`✓ Syntax OK for all ${files.length} source files`)
  process.exit(0)
} else {
  console.error(`\n${failed} file(s) failed syntax check`)
  process.exit(1)
}
