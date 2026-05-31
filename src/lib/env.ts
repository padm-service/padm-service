// export default import.meta.env;
// export default process.env;
// src/env.ts 或 src/lib/env.ts （取决于你的路径）

// 1. 确保在 Node.js 环境下加载了 .env 文件中的变量
import "dotenv/config"; 

// 2. 导出 Node.js 标准的环境变量对象 process.env
//    顺便用 ?? 兼容一下，万一以后又想换回 Bun 也能跑
const env = process.env || (import.meta as any).env;

export default env;