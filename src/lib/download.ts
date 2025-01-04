import fs from "node:fs";
import https from "node:https";

export function download(fileUrl: string, destPath: string) {
  const file = fs.createWriteStream(destPath);
  https.get(fileUrl, (response: any): void => {
    // 检查请求是否成功
    if (response.statusCode === 200) {
      response.pipe(file);
      file.on("finish", (): void => {
        file.close(); // 下载完成后关闭文件流
      });
    }
  }).on("error", (err: Error): void => {
    // 处理请求错误
    console.error("Error downloading file:", err.message);
  });
}
