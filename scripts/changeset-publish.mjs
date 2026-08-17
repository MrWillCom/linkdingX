import { appendFileSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const tag = `v${pkg.version}`

try {
  execSync(`git rev-parse -q --verify refs/tags/${tag}`, { stdio: 'ignore' })
  console.log(`Tag ${tag} already exists, skipping`)
  process.exit(0)
} catch {
  // Tag does not exist yet.
}

execSync(`git tag ${tag}`, { stdio: 'inherit' })
console.log(`Created tag ${tag}`)

const output = process.env.CHANGESETS_OUTPUT
if (!output) {
  throw new Error('CHANGESETS_OUTPUT is not set')
}

appendFileSync(output, `${JSON.stringify({ type: 'git-tag', tag, packageName: pkg.name })}\n`)
