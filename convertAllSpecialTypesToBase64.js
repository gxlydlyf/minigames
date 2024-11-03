// convertAllSpecialTypesToBase64.js
const fs = require('fs');
const path = require('path');
const getMimeType = require('./mime-types');
const toDataUrl = require("./toDataUrl");

function stringToBoolean(str) {
    if (typeof str === 'string') {
        if (str.toLowerCase() === 'true') {
            return true;
        } else if (str.toLowerCase() === 'false') {
            return false;
        }
    }
    return Boolean(str); // 其他字符串返回布尔值
}

const type = process.argv[2].toLowerCase(); // 从命令行参数获取文件类型
const directoryPath = process.argv[3]; // 从命令行参数获取目录路径
const noToBase64 = stringToBoolean(process.argv[4] || false); // 从命令行参数获取是否不转化为base64
const pathPrefix = process.argv[5] || false; // 从命令行参数获取是否在前面加prefix
const outputFile = 'base64Assets.js';

// 检查传入的目录路径和文件类型
if (!type || !directoryPath) {
    console.error('请提供 文件类型 和 目录路径 作为参数.');
    console.error('使用: node convertAllSpecialTypesToBase64.js <type> <workDir> <noToBase64> <pathPrefix>');
    process.exit(1);
}

// 用于存储 Base64 数据
let base64Data = {};

// 支持的格式
const extensionsMap = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'],
    json: ['json'],
    audio: ['mp3'],
    all: true
};

// 根据指定类型获取相应的扩展名数组
const getExtensions = (type) => {
    return extensionsMap[type] || [];
};

// 递归函数读取目录及其子目录中的文件
const readFiles = async (dir, extensions) => {
    // 读取目录中的文件
    const files = fs.readdirSync(dir);
    for (let file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // 如果是目录，递归读取
            await readFiles(filePath, extensions);
        } else {
            // 检查文件扩展名是否是支持的格式
            const ext = path.extname(file).toLowerCase().slice(1);
            if (extensions === true || extensions.includes(ext)) {
                // 读取并转换为 Base64
                const fileContent = fs.readFileSync(filePath);
                let fileName = path.relative(directoryPath, filePath).replace(/\\/g, '/'); // 相对路径
                if (pathPrefix !== false) {
                    fileName = pathPrefix + fileName;
                }
                console.log('save:', fileName);
                if (noToBase64) {
                    let saveContent = fileContent.toString('utf-8');
                    if (type === 'json') {
                        if (saveContent.startsWith('﻿')) {
                            saveContent = saveContent.slice(1);
                        }
                        saveContent = JSON.parse(saveContent);
                    }
                    base64Data[fileName] = saveContent;
                } else {
                    // 获取文件的 MIME 类型
                    // const mimeType = await getMimeType(fileContent, filePath);
                    // base64Data[fileName] = `data:${mimeType};base64,${fileContent.toString('base64')}`;
                    base64Data[fileName] = await toDataUrl(fileContent, filePath);
                }
            }
        }
    }
};

// 获取对应类型的扩展名
const extensions = getExtensions(type);
if (extensions.length === 0) {
    console.error(`不支持的文件类型: ${type}`);
    process.exit(1);
}

// 读取指定目录的文件
readFiles(directoryPath, extensions)
    .then(() => {
        // 输出到 base64Assets.js 文件
        const outputContent = `window.base64Assets = ${JSON.stringify(base64Data, null, 2)};`;
        fs.writeFileSync(outputFile, outputContent);

        console.log(`Base64 ${type} 文件数据已成功输出到 ${outputFile}`);
    })
    .catch(
        e => console.log('error', e)
    );
