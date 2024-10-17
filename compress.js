//压缩更改的文件：node compress.js --only-compress-changed
//压缩指定的文件：node compress.js html1.html html2.html html3.html
//          或：node compress.js html1 html2 html3
//压缩全部的文件：node compress.js
const fs = require('fs-extra');
const path = require('path');
const {minify: minifyHTML} = require('html-minifier-terser');
const crypto = require('crypto');
const compressJavascript = require('./compressJavascript');
const compressFileToDeflate = require("./deflateCompress");
const cliProgress = require('cli-progress'); // 引入进度条库
let chalk;

const rawDir = path.join(__dirname, 'raw');
const minDir = path.join(__dirname, 'min');
const hashDir = path.join(__dirname, 'Hash');
const rawHashDir = path.join(hashDir, 'raw');
const minHashDir = path.join(hashDir, 'min');

fs.ensureDirSync(hashDir);
fs.ensureDirSync(rawHashDir);
fs.ensureDirSync(minHashDir);

let progressBar;
let currentProcessingSize = 0; // 当前处理的文件总大小
let processingFiles = {};// 记录正在处理的文件
let fileSizeCaches = {};
const processesInfo = {
    0: "开始处理",
    1: "读取文件...",
    2: "保存原始文件哈希...",
    3: "压缩 HTML 内容...",
    4: "进行deflate压缩...",
    5: "保存...",
    6: "保存压缩后文件的哈希值..."
};

function formatDateDifference(date1, date2) {
    // 计算时间差（毫秒）
    const diffInMs = Math.abs(date1 - date2);

    // 转换为不同单位
    const years = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diffInMs % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    const days = Math.floor((diffInMs % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    const milliseconds = diffInMs % 1000;

    // 拼接结果
    const parts = [];
    if (years > 0) parts.push(`${years}Y`);
    if (months > 0) parts.push(`${months}M`);
    if (days > 0) parts.push(`${days}D`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (milliseconds > 0) parts.push(`${milliseconds}ms`);

    return parts.join('');
}

function getFileProcesses() {
    var text = '';
    for (const file in processingFiles) {
        const process = processingFiles[file].process;
        const created = processingFiles[file].created;
        const time = formatDateDifference(new Date(), created);
        const empty = '░';
        const notEmpty = '█';
        text += `${file}: ${notEmpty.repeat(process)}${empty.repeat(6 - process)} ${((process / 6) * 100).toFixed(2) + '%'} | 处理时间: ${time} | ${processesInfo[process]}\n`;
    }
    return text;
}

function getHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

async function readFileStream(path) {
    const readStream = fs.createReadStream(path, 'utf-8');
    let content = '';
    for await (const chunk of readStream) {
        content += chunk;
    }
    return content;
}

async function compressHtmlFiles() {
    chalk = (await import("chalk")).default;//引入 chalk
    try {
        const argvFiles = process.argv.slice(2);
        // 读取 raw 目录中的所有文件
        let files = await fs.readdir(rawDir);
        let htmlFiles = files.filter(file => file.endsWith('.html'));

        const replaceHtmlExtension = str => str.endsWith('.html') ? str.slice(0, -5) : str;// 如果字符串不以.html结尾，则返回原字符串

        if (argvFiles.length > 0) {//压缩指定文件
            htmlFiles = htmlFiles.filter(file => argvFiles.includes(file) || argvFiles.includes(replaceHtmlExtension(file)));
            if (argvFiles.includes("--only-compress-changed")) {
                // 读取哈希文件
                let rawHashFiles = await fs.readdir(path.join(hashDir, 'raw'));
                let minHashFiles = await fs.readdir(path.join(hashDir, 'min'));
                let rawHtmlFiles = files.filter(file => file.endsWith('.html'));

                // 用于更改的文件名
                const mismatchedFiles = [];

                for (const file of rawHtmlFiles) {
                    const hashFile = `${file}.hash`;

                    // 检查 raw 中的哈希是否存在
                    if (rawHashFiles.includes(hashFile)) {
                        let rawHashContent = 0;
                        let htmlContent = 1;
                        let currentHash = 1;
                        try {
                            rawHashContent = await readFileStream(path.join(rawHashDir, hashFile));
                            htmlContent = await readFileStream(path.join(rawDir, file));
                            currentHash = getHash(htmlContent);
                        } catch (e) {
                            console.log('raw 中的哈希不存在', e);
                        }
                        if (rawHashContent !== currentHash) {
                            mismatchedFiles.push(file);
                            // console.log(`原始文件哈希不匹配: ${file}`);
                            continue;
                        }
                    } else {
                        mismatchedFiles.push(file);
                        // console.log(`找不到原始文件哈希: ${file}`);
                        continue;
                    }

                    // 检查 min 中的哈希是否存在
                    if (minHashFiles.includes(hashFile)) {
                        let minHashContent = 0;
                        let minifiedHtml = 1;
                        let minifiedHash = 1;
                        try {
                            minHashContent = await readFileStream(path.join(minHashDir, hashFile));
                            minifiedHtml = await readFileStream(path.join(minDir, file));
                            minifiedHash = getHash(minifiedHtml);
                        } catch (e) {
                            console.log('min 中的哈希不存在', e);
                        }

                        if (minHashContent !== minifiedHash) {
                            mismatchedFiles.push(file);
                            // console.log(`压缩文件哈希不匹配: ${file}`);
                        }
                    } else {
                        mismatchedFiles.push(file);
                        // console.log(`找不到压缩文件哈希: ${file}`);
                    }
                }

                try {
                    // 读取 raw 目录中的所有文件名
                    const rawFiles = await fs.readdir(rawDir);
                    const rawFileNames = rawFiles.filter(file => file.endsWith('.html')); // 只考虑 .html 文件

                    // 读取 min 目录中的所有文件名
                    const minFiles = await fs.readdir(minDir);
                    // 读取 Hash/min 目录中的所有文件名
                    const minHashFiles = await fs.readdir(minHashDir);
                    // 读取 Hash/raw 目录中的所有文件名
                    const rawHashFiles = await fs.readdir(rawHashDir);

                    let deleted = false;

                    // 遍历 min 目录中的文件，检查并删除不在 raw 目录中的文件
                    for (const minFile of minFiles) {
                        if (!rawFileNames.includes(minFile)) {
                            await fs.remove(path.join(minDir, minFile));
                            console.log(`删除raw已经删除的文件: min/${minFile}`);
                            deleted = true;
                        }
                    }
                    // 遍历 Hash/min 目录中的文件
                    for (const minHashFile of minHashFiles) {
                        if (!rawFileNames.includes(minHashFile.slice(0, -".hash".length))) {
                            await fs.remove(path.join(minHashDir, minHashFile));
                            console.log(`删除raw已经删除的文件: Hash/min/${minHashFile}`);
                            deleted = true;
                        }
                    }
                    // 遍历 Hash/raw 目录中的文件
                    for (const rawHashFile of rawHashFiles) {
                        if (!rawFileNames.includes(rawHashFile.slice(0, -".hash".length))) {
                            await fs.remove(path.join(rawHashDir, rawHashFile));
                            console.log(`删除raw已经删除的文件: Hash/raw/${rawHashFile}`);
                            deleted = true;
                        }
                    }

                    if (deleted) {
                        console.log('删除raw已经删除的文件完成');
                    }
                } catch (error) {
                    console.error('删除raw已经删除的文件完成发生错误:', error);
                }
                htmlFiles = mismatchedFiles;
                if (mismatchedFiles.length <= 0) {
                    console.log('没有更改的文件');
                    return;
                } else {
                    console.log('更改的文件：', mismatchedFiles);
                }
                // return;
            }
        } else {//压缩所有文件
            // 删除 min 目录中的所有文件
            await fs.emptyDir(minDir);
            await fs.emptyDir(minHashDir);
            console.log('清空 min 目录成功');
        }

        // 创建进度条实例
        progressBar = new cliProgress.SingleBar({
            format: `{bar} {percentage}% | {value}/{total} 文件处理 | 
经过时间/预期完成时间 {duration_formatted}/{eta_formatted} | 当前处理大小: {current_processing_size}MB | 
处理中: {files}
{file_processes}
`,
            hideCursor: true, // 隐藏光标
            emptyOnZero: true
        }, cliProgress.Presets.shades_classic);

        progressBar.start(htmlFiles.length, 0, {
            files: JSON.stringify(Object.keys(processingFiles)),
            current_processing_size: currentProcessingSize / 1024 / 1024,
            file_processes: getFileProcesses()
        }); // 启动进度条

        async function asyncPool(files, maxConcurrentSize) {
            // 定义变量
            let i = 0; // 当前处理文件的索引
            const ret = []; // 存储所有文件处理的Promise
            const executing = []; // 存储正在执行的Promise

            // 定义一个用于处理文件的函数
            const enqueue = async () => {
                // 边界处理，判断是否还有文件待处理
                if (i >= files.length) {
                    return Promise.resolve(); // 如果没有文件了，返回一个resolved Promise
                }

                const file = files[i++]; // 获取当前文件
                const fileSize = await getFileSize(file); // 获取文件大小

                // 处理文件的Promise
                const p = Promise.resolve().finally(async () => {
                    processingFiles[file] = {process: 0, created: new Date()}; // 将当前文件添加到正在处理的列表中
                    currentProcessingSize += fileSize; // 更新当前处理的文件大小
                    progressBar.increment(0, {
                        files: JSON.stringify(Object.keys(processingFiles)),
                        current_processing_size: currentProcessingSize / 1024 / 1024, // 以MB为单位显示大小
                        file_processes: getFileProcesses()
                    });
                    console.log(chalk.yellow(`开始处理: ${file}`)); // 输出开始处理的日志

                    await processFile(file); // 处理文件

                    // 处理完成后，更新状态
                    delete processingFiles[file]; // 从正在处理的列表中移除
                    currentProcessingSize -= fileSize; // 更新当前处理的文件大小
                    console.log(chalk.green(`处理完成: ${file}`)); // 输出处理完成的日志
                    progressBar.increment(1, {
                        files: JSON.stringify(Object.keys(processingFiles)),
                        current_processing_size: currentProcessingSize / 1024 / 1024, // 以MB为单位显示大小
                        file_processes: getFileProcesses()
                    });
                });

                ret.push(p); // 将Promise添加到结果数组中

                // 创建一个Promise，用于从executing数组中删除已完成的Promise
                const e = p.then(() => {
                    const index = executing.indexOf(e);
                    if (index !== -1) {
                        executing.splice(index, 1);
                    }
                });

                executing.push(e); // 将正在执行的Promise添加到executing数组中

                // 使用Promise.race，每当符合条件，就实例化新的promise并执行
                let r = Promise.resolve();
                if (
                    (currentProcessingSize + fileSize < maxConcurrentSize) ||
                    Object.keys(processingFiles).length <= 0
                ) {
                    r = Promise.race(executing);
                }

                // 递归，直到遍历完array
                return r.then(() => enqueue());
            };

            // 开始处理文件并返回所有Promise的结果
            return enqueue().then(() => Promise.all(ret));
        }


        // 一个函数来获取文件大小
        async function getFileSize(file) {
            fileSizeCaches[file] = fileSizeCaches[file] || (await fs.stat(path.join(rawDir, file))).size;
            return fileSizeCaches[file]; // 返回文件大小，单位为字节
        }

        await asyncPool(
            htmlFiles,
            30 * 1024 * 1024 // 30MB
        );

        progressBar.stop(); // 停止进度条
        console.log('所有 HTML 文件压缩完成');
    } catch (error) {
        console.error('发生错误:', error);
    }
}

async function processFile(file) {
    const update = num => {
        processingFiles[file].process += num || 1;
        progressBar.increment(0, {
            file_processes: getFileProcesses()
        });
    };
    try {
        update();
        const filePath = path.join(rawDir, file);
        const htmlContent = await readFileStream(filePath);

        //保存原始文件哈希
        update();
        const hash = getHash(htmlContent);
        await fs.writeFile(path.join(rawHashDir, `${file}.hash`), hash);
        console.log(`保存原始文件哈希: ${file}.hash`);

        update();
        let minifiedHtml = htmlContent;

        // 压缩 HTML 内容
        if (!["EaglercraftX_1.8_Offline_International.html"].includes(file)) {
            try {
                minifiedHtml = await minifyHTML(minifiedHtml, {
                    removeAttributeQuotes: true,
                    collapseWhitespace: true,
                    minifyJS: async function (code) {
                        try {
                            code = await compressJavascript(code);
                        } catch (e) {
                            console.error('babel并压缩js发生错误:', e);
                        }
                        return code;
                    },
                    minifyCSS: true,
                    removeComments: true,
                    removeCommentsFromCDATA: true,
                    caseSensitive: true,
                });
            } catch (e) {
                console.error(`压缩html错误: ${file}`);
            }
        }

        if (Buffer.byteLength(minifiedHtml) > 1000000) {//大于1MB进行deflate压缩
            minifiedHtml = await compressFileToDeflate(minifiedHtml);
            update();
            console.log(`进行deflate压缩: ${file}`);
        } else {
            update(2);
        }

        update();
        // 将压缩后的 HTML 写入 min 目录
        await fs.writeFile(path.join(minDir, file), minifiedHtml);
        console.log(`压缩并保存: ${file}`);

        // 保存压缩后文件的哈希值
        update();
        const minifiedHash = getHash(minifiedHtml);
        await fs.writeFile(path.join(minHashDir, `${file}.hash`), minifiedHash);
        console.log(`保存压缩文件哈希: ${file}.hash`);
    } catch (e) {
        console.error(`压缩${file}时发生错误`, e)
    }
}

compressHtmlFiles().then(new Function());
