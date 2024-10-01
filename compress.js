//压缩更改的文件：node compress.js --only-compress-changed
//压缩指定的文件：node compress.js html1.html html2.html html3.html
//          或：node compress.js html1 html2 html3
//压缩全部的文件：node compress.js
const fs = require('fs-extra');
const path = require('path');
const {minify} = require('html-minifier');
const crypto = require('crypto');
const {JSDOM} = require("jsdom");
const babel = require('@babel/core');
const Terser = require("terser");
const compressFileToDeflate = require("./deflateCompress");

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

        const replaceHtmlExtension = (str) => {
            if (str.endsWith('.html')) {
                return str.slice(0, -5);
            }
            return str; // 如果字符串不以.html结尾，则返回原字符串
        }

        if (argvFiles.length > 0) {//压缩指定文件
            htmlFiles = htmlFiles.filter(
                file => argvFiles.includes(file) ||
                    argvFiles.includes(
                        replaceHtmlExtension(file)
                    )
            )
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

                    let deleted = false;

                    // 遍历 min 目录中的文件，检查并删除不在 raw 目录中的文件
                    for (const minFile of minFiles) {
                        if (!rawFileNames.includes(minFile)) {
                            await fs.remove(path.join(minDir, minFile));
                            console.log(`删除raw已经删除的文件: ${minFile}`);
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

            let minifiedHtml = htmlContent;


            try {
                //将index.html转化为es5
                // 使用 jsdom 解析 HTML
                const dom = new JSDOM(minifiedHtml);
                const {document} = dom.window;

                // 查找所有 <script> 标签并转换内容
                const scripts = document.querySelectorAll('script');
                const transformedJsPromises = [];

                scripts.forEach(script => {
                    const jsCode = script.textContent;

                    const transformedPromise = new Promise(async function (resolve, reject) {
                        let result = jsCode;
                        // if (file === 'index.html') {
                        try {
                            result = (
                                await babel.transformAsync(jsCode, {
                                    compact: false,//[BABEL] Note: The code generator has deoptimised the styling of undefined as it exceeds the max of 500KB.
                                    presets: [
                                        [
                                            '@babel/preset-env',
                                            {
                                                modules: false
                                            }
                                        ]
                                    ],
                                    plugins: [
                                        [
                                            "@babel/plugin-transform-modules-commonjs",
                                            {
                                                strictMode: false
                                            }
                                        ],
                                    ]
                                })
                            ).code;
                        } catch (e) {
                            console.error('babel js发生错误:', e);
                        }
                        // }
                        try {
                            result = (
                                await Terser.minify(result, {
                                    ecma: 5,
                                    compress: {
                                        // warnings: false,
                                        drop_debugger: true,
                                        drop_console: true,
                                        arrows: false,
                                    },
                                    ie8: true,
                                    safari10: true
                                })
                            ).code;
                        } catch (e) {
                            console.error('minify js发生错误:', e);
                        }
                        // 创建新的 <script> 标签
                        // const newScript = document.createElement('script');
                        // newScript.textContent = result;
                        // script.replaceWith(newScript); // 替换旧的 <script> 标签
                        // 替换内容
                        script.textContent = result;
                        resolve();
                    });

                    transformedJsPromises.push(transformedPromise);
                });
                // 等待所有 JS 转换完成
                await Promise.all(transformedJsPromises);

                // 获取转换后的 HTML 内容
                minifiedHtml = dom.serialize();
                // console.log('转换后的 HTML 内容', minifiedHtml)
            } catch (e) {
                console.error('babel并压缩js发生错误:', e);
                // await fs.writeFile(path.join(hashDir, 'raw', `${file}.hash`), "");
            }

            // 压缩 HTML 内容
            try {
                minifiedHtml = minify(minifiedHtml, {
                    removeAttributeQuotes: true,
                    collapseWhitespace: true,
                    minifyCSS: true,
                    minifyJS: false,
                    removeComments: true,
                    removeCommentsFromCDATA: true,
                });
            } catch (e) {
                console.error(`压缩html错误: ${file}`);
            }

            if (Buffer.byteLength(minifiedHtml) > 1000000) {//大于1MB进行deflate压缩
                minifiedHtml = await compressFileToDeflate(minifiedHtml);
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
