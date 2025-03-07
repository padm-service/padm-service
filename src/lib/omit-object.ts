export function Omit<T extends object, K extends keyof T>(obj: T, uselessKeys: K[]): Omit<T, K> {
  return uselessKeys.reduce((acc, key) => {
    // 使用剩余参数和展开运算符来复制对象，除了要排除的键
    const { [key]: _, ...rest } = obj;
    return { ...acc, ...rest };
  }, {}) as Omit<T, K>;
}
