//加密哈希工具
//hexify将数据转换为十六进制字符串
//digest计算数据的加密哈希值
export function hexify(b: ArrayBuffer | string) {
  const a = typeof b === "string" ? new TextEncoder().encode(b) : b;
  return [...new Uint8Array(a)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

export async function digest(
  alg: AlgorithmIdentifier,
  b: ArrayBuffer | string,
) {
  const a = typeof b === "string" ? new TextEncoder().encode(b) : b;
  return await crypto.subtle.digest(alg, a);
}
