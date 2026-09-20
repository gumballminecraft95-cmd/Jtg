You reached the start of the range
2026-09-20 17:46
unpacking archive
2.3 MB
21ms
uploading snapshot
666.2 KB
12ms

internal
load build definition from Dockerfile
0ms

internal
load metadata for docker.io/library/node:22-alpine
266ms

internal
load .dockerignore
0ms

1
FROM docker.io/library/node:22-alpine@sha256:b6f26b36c8ff49624cfdac716b8ea1138d606df02586a77d364bb5536a634f85
133ms

internal
load build context
0ms

5
RUN npm install --no-audit --no-fund --legacy-peer-deps cached
0ms

4
COPY package*.json ./ cached
0ms

3
WORKDIR /app cached
0ms

2
RUN apk add --no-cache docker-cli git make g++ python3 curl cached
0ms

6
COPY . .
691ms

7
RUN if [ ! -f "dist/server.cjs" ] || [ ! -f "dist/index.html" ]; then NODE_OPTIONS="--max-old-space-size=2048" npm run build; fi
10s
> react-example@3.0.0 build
> vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
vite v6.4.3 building for production...
transforming...
✓ 2819 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.65 kB │ gzip:   0.40 kB
dist/assets/index-0ZXyQm2z.css    186.11 kB │ gzip:  27.01 kB
dist/assets/index-BbY_Smlv.js   1,433.22 kB │ gzip: 403.05 kB
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 8.29s
✘ [ERROR] No matching export in "src/server/services/local.ts" for import "createLocalServer"
    src/server/services/runtime.ts:16:2:
      16 │   createLocalServer,
         ╵   ~~~~~~~~~~~~~~~~~
✘ [ERROR] No matching export in "src/server/services/local.ts" for import "killLocalServer"
    src/server/services/runtime.ts:19:2:
      19 │   killLocalServer,
         ╵   ~~~~~~~~~~~~~~~
✘ [ERROR] No matching export in "src/server/services/local.ts" for import "restartLocalServer"
    src/server/services/runtime.ts:20:2:
      20 │   restartLocalServer,
         ╵   ~~~~~~~~~~~~~~~~~~
✘ [ERROR] No matching export in "src/server/services/local.ts" for import "deleteLocalServer"
    src/server/services/runtime.ts:21:2:
      21 │   deleteLocalServer,
         ╵   ~~~~~~~~~~~~~~~~~
✘ [ERROR] No matching export in "src/server/services/local.ts" for import "getLocalServerStatus"
    src/server/services/runtime.ts:22:2:
      22 │   getLocalServerStatus,
         ╵   ~~~~~~~~~~~~~~~~~~~~
✘ [ERROR] No matching export in "src/server/services/local.ts" for import "getLocalServerStats"
    src/server/services/runtime.ts:23:2:
      23 │   getLocalServerStats,
         ╵   ~~~~~~~~~~~~~~~~~~~
6 of 14 errors shown (disable the message limit with --log-limit=0)
Build Failed: build daemon returned an error < failed to solve: process "/bin/sh -c if [ ! -f \"dist/server.cjs\" ] || [ ! -f \"dist/index.html\" ]; then NODE_OPTIONS=\"--max-old-space-size=2048\" npm run build; fi" did not complete successfully: exit code: 1 >
scheduling build on Metal builder "builder-zthdex"
You reached the end of the range
2026-09-20 17:56
