const { spawn, execSync } = require('child_process')
const path = require('path')

async function startDev() {
  const root = path.resolve(__dirname, '..')

  // Step 1: Compile Electron TypeScript
  console.log('🔨 Building Electron main process...')
  try {
    execSync('"node_modules/.bin/tsc.cmd" -p tsconfig.node.json', {
      stdio: 'inherit',
      cwd: root,
      shell: true,
    })
  } catch (e) {
    console.error('❌ TypeScript compilation failed')
    process.exit(1)
  }

  // Step 2: Start Vite dev server for renderer
  console.log('🚀 Starting Vite dev server...')
  const { createServer } = await import('vite')
  const vite = await createServer({
    configFile: path.resolve(root, 'vite.config.ts'),
    server: { port: 5173 },
  })
  await vite.listen()

  const url = 'http://localhost:5173'
  console.log(`✅ Vite ready at ${url}`)

  // Step 3: Launch Electron
  console.log('⚡ Launching Electron...')
  const electronPath = path.resolve(root, 'node_modules/electron/dist/electron.exe')
  const electron = spawn(electronPath, [path.resolve(root, 'dist-electron/main.js')], {
    env: {
      ...process.env,
      ELECTRON_RENDERER_URL: url,
      NODE_ENV: 'development',
    },
    stdio: 'inherit',
  })

  electron.on('close', () => {
    vite.close()
    process.exit(0)
  })
}

startDev().catch((err) => {
  console.error('Failed to start:', err)
  process.exit(1)
})
