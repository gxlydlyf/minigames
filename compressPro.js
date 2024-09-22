const fs = require('fs-extra');
const path = require('path');
const { minify } = require('html-minifier');

const rawDir = path.join(__dirname, 'raw');
const minDir = path.join(__dirname, 'min');

async function compressHtmlFiles() {
    try {
        // 删除 min 目录中的所有文件
        await fs.emptyDir(minDir);
        console.log('清空 min 目录成功');

        // 读取 raw 目录中的所有文件
        const files = await fs.readdir(rawDir);
        const htmlFiles = files.filter(file => file.endsWith('.html'));

        // 创建一个数组，用于存储所有的压缩操作
        const compressPromises = htmlFiles.map(async (file) => {
            const filePath = path.join(rawDir, file);
            const htmlContent = await fs.readFile(filePath, 'utf-8');

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
        });

        // 使用 Promise.all 并行处理所有压缩任务
        await Promise.all(compressPromises);

        console.log('所有 HTML 文件压缩完成');
    } catch (error) {
        console.error('发生错误:', error);
    }
}

compressHtmlFiles();
