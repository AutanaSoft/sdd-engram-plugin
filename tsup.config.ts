import { defineConfig } from 'tsup';
import { solidPlugin } from 'esbuild-plugin-solid';

export default defineConfig({
  entry: {
    tui: 'index.tsx',
  },
  noExternal: ['@opentui/solid'],
  format: ['esm'],
  clean: true,
  dts: false,
  outDir: 'dist',
  minify: false,
  external: [
    '@opencode-ai/plugin',
    'solid-js',
    'fs',
    'path',
    'os',
    'child_process',
    'node:fs',
    'node:path',
    'node:child_process',
    'node:os'
  ],
  esbuildPlugins: [
    solidPlugin({
      solid: {
        moduleName: '@opentui/solid',
        generate: 'universal',
      },
    }),
  ],
});
