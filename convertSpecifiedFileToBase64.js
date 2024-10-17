//convertSpecifiedFileToBase64.js
const fs = require('fs');
const path = require('path');
const getMimeType = require('./mime-types');

const directoryPath = process.argv[2]; // 从命令行参数获取目录路径

// 检查传入的目录路径和文件
if (!directoryPath || !(process.argv.length > 2)) {
    console.error('请提供 目录路径 和 文件 作为参数.');
    console.error('使用: node convertSpecifiedFileToBase64.js <type> <...files>');
    process.exit(1);
}

// 用于存储 Base64 数据
var base64Data = {};

const files = process.argv.slice(3);

console.log('files', files);

// 遍历文件列表
Promise.all(
    files.map(async file => {
        const filePath = path.join(directoryPath, file);

        // 读取文件内容
        try {
            // 读取文件内容
            const data = fs.readFileSync(filePath);

            // 将内容转换为 Base64
            base64Data[file] = `data:${await getMimeType(data, filePath)};base64,` + data.toString('base64');
        } catch (err) {
            console.error(`无法读取文件 ${file}: ${err.message}`);
        }
    })
).then(() => {
    // 输出到 base64_special_types.js 文件
    const outputContent = `var base64SpecifiedFiles = ${JSON.stringify(base64Data, null, 2)};`;
    const outputFile = 'base64_specified_files.js';
    fs.writeFileSync(outputFile, outputContent);

    console.log(`Base64 指定文件数据已成功输出到 ${outputFile}`);
});


