import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";

const port = env.PORT;
// eslint-disable-next-line no-console
console.log(`Server is running on port http://localhost:${port}`);
    // "dev": "tsx watch src/index.ts",
    // "start": "node ./dist/src/index.js",
import v8 from 'node:v8';

const heapLimit = v8.getHeapStatistics().heap_size_limit / 1024 / 1024;
console.log(`✅ 当前内存限制: ${heapLimit.toFixed(2)} MB`);
serve({
  fetch: app.fetch,
  port,
});
