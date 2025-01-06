import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { MappingDocumentTransformer } from "@langchain/core/documents";

// const loader = new PDFLoader("C:/Users/wbl/Desktop/091无核沃柑种植技术0629.pdf");
// const docs = await loader.load();
// // console.log(docs);
// console.log(docs[1]);

// 读取文件
const loader = new DocxLoader("C:\\Users\\wbl\\Desktop\\test.docx");

const documents = await loader.load();

console.log(documents);

