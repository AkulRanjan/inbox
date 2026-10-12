// Build tasks, run with gulp and compiled with esbuild, as VS Code does.
//   gulp compile   one-off build into out/
//   gulp watch     rebuild on change (reload the window with Help > Reload Window)

import { build, context } from 'esbuild'
import gulp from 'gulp'
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const OUT = 'out'

/** One esbuild configuration per process: main (Node), preload (sandboxed), renderer, worker. */
const bundles = [
  {
    entryPoints: { 'vs/code/electron-main/main': 'src/vs/code/electron-main/main.ts' },
    platform: 'node',
    format: 'cjs',
    external: ['electron']
  },
  {
    entryPoints: {
      'vs/base/parts/sandbox/electron-browser/preload': 'src/vs/base/parts/sandbox/electron-browser/preload.ts'
    },
    platform: 'node',
    format: 'cjs',
    external: ['electron']
  },
  {
    entryPoints: { 'vs/code/electron-browser/workbench/workbench': 'src/vs/code/electron-browser/workbench/workbench.ts' },
    platform: 'browser',
    format: 'iife',
    loader: { '.ttf': 'file' },
    assetNames: 'media/[name]-[hash]'
  },
  {
    entryPoints: { 'vs/editor/editor.worker': 'monaco-editor/editor/editor.worker' },
    platform: 'browser',
    format: 'iife'
  }
]

const common = {
  bundle: true,
  outdir: OUT,
  target: 'es2022',
  sourcemap: 'linked',
  tsconfig: 'tsconfig.json',
  logLevel: 'info'
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))
  )
  return files.flat()
}

/** Static files the bundles load at runtime. */
async function copyStatic() {
  await mkdir(join(OUT, 'vs/code/electron-browser/workbench'), { recursive: true })
  await copyFile(
    'src/vs/code/electron-browser/workbench/workbench.html',
    join(OUT, 'vs/code/electron-browser/workbench/workbench.html')
  )
  await mkdir(join(OUT, 'media'), { recursive: true })
  await copyFile('node_modules/vscode-oniguruma/release/onig.wasm', join(OUT, 'media/onig.wasm'))

  // Manifests of the built-in extensions in one file (VS Code bundles these the same way).
  const dirs = (await readdir('extensions', { withFileTypes: true })).filter((e) => e.isDirectory())
  const extensions = await Promise.all(
    dirs.map(async (d) => ({
      dir: d.name,
      manifest: JSON.parse(await readFile(join('extensions', d.name, 'package.json'), 'utf8'))
    }))
  )
  await writeFile(join(OUT, 'builtin-extensions.json'), JSON.stringify(extensions))
}

/** Unit tests: every `*.test.ts` under a `test/` folder, bundled for Node and run by mocha. */
async function testBundle() {
  const tests = (await walk('src')).filter((f) => /[\\/]test[\\/].*\.test\.ts$/.test(f))
  return {
    entryPoints: Object.fromEntries(
      tests.map((f) => [relative('src', f).replace(/\\/g, '/').replace(/\.ts$/, ''), f])
    ),
    platform: 'node',
    format: 'cjs',
    external: ['electron', 'mocha']
  }
}

export async function clean() {
  await rm(OUT, { recursive: true, force: true })
}

async function bundle() {
  const configs = [...bundles, await testBundle()]
  await Promise.all(configs.map((config) => build({ ...common, ...config })))
  await copyStatic()
}

export const compile = gulp.series(clean, bundle)

async function watchBundles() {
  const configs = [...bundles, await testBundle()]
  await copyStatic()
  for (const config of configs) {
    const ctx = await context({ ...common, ...config })
    await ctx.watch()
  }
  console.log('Watching for changes. Static files (HTML, extensions) need `gulp compile`.')
  return new Promise(() => {}) // keep the task running
}

export const watch = gulp.series(clean, watchBundles)

export default compile
