const fs = require("fs");
const getMimeType = require("./mime-types");

function isBinary(buffer) {
    // 检查 Buffer 中的每个字节
    for (let i = 0; i < buffer.length; i++) {
        // 检查是否有非可打印字符（小于 32 或大于 126）
        if (buffer[i] < 32 && buffer[i] !== 9 && buffer[i] !== 10 && buffer[i] !== 13) {
            return true; // 存在非可打印字符，认为是二进制数据
        }
    }
    return false; // 没有非可打印字符，认为是文本数据
}

module.exports = async function (buffer, path) {
    if (!(buffer instanceof Buffer)) {
        buffer = fs.readFileSync(path);
    }
    const hasBinary = isBinary(buffer);
    const mime = await getMimeType(buffer, path)
    if (hasBinary){
        return `data:${mime};base64,` + buffer.toString('base64');
    }else{
        return `data:${mime};charset=utf-8,` + encodeURIComponent(buffer.toString('utf-8'));
    }
};