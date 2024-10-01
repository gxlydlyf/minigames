//convertFilesToBase64.js
const fs = require('fs');
const path = require('path');

const directoryPath = process.argv[2]; // 从命令行参数获取目录路径
const outputFile = 'base64_files.js';

if (!directoryPath) {
    console.error('请提供一个目录路径作为参数.');
    process.exit(1);
}

// 用于存储 Base64 数据
let base64FilesData = {};

// 递归函数读取目录及其子目录中的文件
const readFiles = (dir) => {
    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // 如果是目录，递归读取
            readFiles(filePath);
        } else {
            // 如果是文件，读取并转换为 Base64
            const fileContent = fs.readFileSync(filePath);
            const base64Content = fileContent.toString('base64');
            const fileName = path.relative(directoryPath, filePath); // 相对路径
            base64FilesData[fileName] = base64Content;
        }
    });
};

// 读取指定目录的文件
readFiles(directoryPath);

// 输出到 base64_files.js 文件
const outputContent = `var base64FilesData = ${JSON.stringify(base64FilesData, null, 2)};`;
fs.writeFileSync(outputFile, outputContent);

console.log(`Base64 数据已成功输出到 ${outputFile}`);
