//node compress.js --only-compress-changed
const fs = require('fs-extra');
const path = require('path');
const {minify} = require('html-minifier');
const crypto = require('crypto');

const rawDir = path.join(__dirname, 'raw');
const minDir = path.join(__dirname, 'min');

const hashDir = path.join(__dirname, 'Hash');

// 确保 Hash 目录存在
fs.ensureDirSync(hashDir);
fs.ensureDirSync(path.join(hashDir, 'raw'));
fs.ensureDirSync(path.join(hashDir, 'min'));

async function compressHtmlFiles() {
    try {
        const argvFiles = process.argv.slice(2);
        let files;
        // 读取 raw 目录中的所有文件
        files = await fs.readdir(rawDir);
        let htmlFiles = files.filter(file => file.endsWith('.html'));

        if (argvFiles.length > 0) {//压缩指定文件
            htmlFiles = htmlFiles.filter(file => argvFiles.includes(file))
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
                        const rawHashContent = await fs.readFile(path.join(hashDir, 'raw', hashFile), 'utf-8');
                        const htmlContent = await fs.readFile(path.join(rawDir, file), 'utf-8');
                        const currentHash = crypto.createHash('sha256').update(htmlContent).digest('hex');

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
                        const minHashContent = await fs.readFile(path.join(hashDir, 'min', hashFile), 'utf-8');
                        const minifiedHtml = await fs.readFile(path.join(minDir, file), 'utf-8');
                        const minifiedHash = crypto.createHash('sha256').update(minifiedHtml).digest('hex');

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

                    // 遍历 min 目录中的文件，检查并删除不在 raw 目录中的文件
                    for (const minFile of minFiles) {
                        if (!rawFileNames.includes(minFile)) {
                            await fs.remove(path.join(minDir, minFile));
                            console.log(`删除raw已经删除的文件: ${minFile}`);
                        }
                    }

                    console.log('删除raw已经删除的文件完成');
                } catch (error) {
                    console.error('发生错误:', error);
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
            console.log('清空 min 目录成功');
        }

        // 创建一个数组，用于存储所有的压缩操作
        const compressPromises = htmlFiles.map(async (file) => {
            const filePath = path.join(rawDir, file);
            const htmlContent = await fs.readFile(filePath, 'utf-8');

            // 生成文件的哈希值
            const hash = crypto.createHash('sha256').update(htmlContent).digest('hex');
            await fs.writeFile(path.join(hashDir, 'raw', `${file}.hash`), hash);
            console.log(`保存原始文件哈希: ${file}.hash`);

            // 压缩 HTML 内容
            let minifiedHtml = htmlContent;
            try {
                minifiedHtml = minify(htmlContent, {
                    removeAttributeQuotes: true,
                    collapseWhitespace: true,
                    minifyCSS: true,
                    minifyJS: true,
                    removeComments: true,
                    removeCommentsFromCDATA: true,
                });
            } catch (e) {
                console.log(`压缩错误: ${file}`);
            }

            // 将压缩后的 HTML 写入 min 目录
            await fs.writeFile(path.join(minDir, file), minifiedHtml);
            console.log(`压缩并保存: ${file}`);


            // 保存压缩后文件的哈希值
            const minifiedHash = crypto.createHash('sha256').update(minifiedHtml).digest('hex');
            await fs.writeFile(path.join(hashDir, 'min', `${file}.hash`), minifiedHash);
            console.log(`保存压缩文件哈希: ${file}.hash`);
        });

        // 使用 Promise.all 并行处理所有压缩任务
        await Promise.all(compressPromises);

        console.log('所有 HTML 文件压缩完成');
    } catch (error) {
        console.error('发生错误:', error);
    }
}

compressHtmlFiles().then(new Function());
