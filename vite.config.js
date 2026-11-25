import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// The build produces ONE self-contained dist/index.html (JS + CSS inlined),
// so it can be opened offline or dropped on a shared drive / VDI.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { target: 'es2019', chunkSizeWarningLimit: 2000 },
})
