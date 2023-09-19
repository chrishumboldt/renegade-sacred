import dts from 'bun-plugin-dts'

const start = Date.now()

const { logs } = await Bun.build({
  entrypoints: ['./src/index.ts'],
  minify: true,
  outdir: './dist',
  plugins: [dts()]
});

if (logs && logs.length > 0) {
  for (let log of logs) {
    console.log(log)
  }
} else {
  console.log('')
  console.log(`\x1b[32m⚡${Date.now() - start}ms\x1b[39m Build complete`)
}

