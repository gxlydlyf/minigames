// embedResources.js
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const postcss = require('postcss');
const postcssUrl = require('postcss-url');
const getMimeType = require('./mime-types');
const axios = require('axios');

function getBase64UrlBuffer(str) {
    // 检查 data URL 的格式
    const matches = str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);

    if (!matches) {
        return false;
    }

    return Buffer.from(matches[2], 'base64');
}

// 下载远程资源
async function fetchUrl(url) {
    console.log('fetch url', url);
    const response = await axios.get(url);
    // const mimeType = response.headers['content-type'] || 'application/octet-stream';
    // const base64 = Buffer.from(, 'binary').toString('base64');
    return response.data;
}

// 获取文件内容
async function getFileContent(filePath) {
    let base64UrlBuffer = getBase64UrlBuffer(filePath);
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return Buffer.from(await fetchUrl(filePath), 'utf-8');
    } else if (base64UrlBuffer !== false) {
        return base64UrlBuffer;
    } else {
        return fs.readFileSync(filePath, 'utf-8');
    }
}

// 转换文件为 Base64
async function fileToBase64(filePath) {
    let fileBuffer = await getFileContent(filePath);
    return `data:${await getMimeType(fileBuffer, filePath)};base64,${fileBuffer.toString('base64')}`;
}

// 替换 CSS 中的 url(...) 为 Base64
async function replaceUrlInCss(cssContent, workDir) {
    const result = await postcss()
        .use(postcssUrl({
            url: async (asset) => {
                if (typeof asset.url == 'string') {
                    const assetUrl = asset.url.trim();
                    if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
                        console.log('embed css online url:', assetUrl);
                        // 处理远程资源
                        return Buffer.from(await fetchUrl(assetUrl)).toString('base64');
                    } else if (getBase64UrlBuffer(assetUrl) === false) {
                        // 处理本地资源
                        const assetPath = path.join(workDir, assetUrl);
                        if (fs.existsSync(assetPath)) {
                            console.log('embed css local path:', assetPath);
                            return await fileToBase64(assetPath);
                        } else {
                            console.warn(`URL not found in CSS: ${assetPath}`);
                            return assetUrl; // 保持原样
                        }
                    }
                }
                return asset.url;
            }
        }))
        .process(cssContent, {
            from: undefined
        });

    return result.css;
}

// 嵌入 JS、CSS、图片和音频资源
async function embedResources(workDir, inputFileName) {
    const inputFilePath = path.join(workDir, inputFileName);

    // 读取 HTML 文件
    const html = await getFileContent(inputFilePath);
    const $ = cheerio.load(html);

    await Promise.all(
        [
            // 处理 <script> 标签
            ...$('script[src]')
                .map(async (_, script) => {
                    const $script = $(script);
                    const src = $script.attr('src');
                    const scriptPath = path.join(workDir, src);
                    const embedBase64Url = $script.attr('embedBase64Url'.toLowerCase());

                    if (fs.existsSync(scriptPath)) {
                        if (embedBase64Url === 'true') {
                            $script.attr('src', await fileToBase64(scriptPath));
                            $script.attr('embedBase64Url'.toLowerCase(), null)
                            console.log('embed base64 script:', scriptPath);
                        } else {
                            const scriptContent = await getFileContent(scriptPath);
                            $script.attr('src', null);
                            $script.text(`\n${scriptContent}\n`);
                            console.log('embed script:', scriptPath);
                        }
                    } else {
                        console.warn(`Script not found: ${scriptPath}`);
                    }
                }),
            // 处理 <style> 标签
            ...$('style')
                .map(async (_, style) => {
                    const $style = $(style);
                    $style.replaceWith(`<style>\n${await replaceUrlInCss($style.text(), workDir)}\n</style>`);
                }),
            // 处理 <link> 标签 (CSS)
            ...$('link[rel="stylesheet"]')
                .map(async (_, link) => {
                    const $link = $(link);
                    const href = $link.attr('href');
                    const cssPath = path.join(workDir, href);

                    if (fs.existsSync(cssPath)) {
                        let cssContent = await getFileContent(cssPath);
                        cssContent = await replaceUrlInCss(cssContent, workDir);
                        $link.replaceWith(`<style>\n${cssContent}\n</style>`);
                        console.log('embed link css:', cssPath);
                    } else {
                        console.warn(`CSS not found: ${cssPath}`);
                    }
                }),
            // 处理 <img> 标签
            ...$('img[src]')
                .map(async (_, img) => {
                    const $img = $(img);
                    const src = $img.attr('src');
                    const imgPath = path.join(workDir, src);

                    if (fs.existsSync(imgPath)) {
                        const base64Image = await fileToBase64(imgPath);
                        $img.attr('src', base64Image);
                        console.log('embed img:', imgPath);
                    } else {
                        console.warn(`Image not found: ${imgPath}`);
                    }
                }),
            // 处理 <audio> 标签
            ...$('audio[src]')
                .map(async (_, audio) => {
                    const $audio = $(audio);
                    const src = $audio.attr('src');
                    const audioPath = path.join(workDir, src);

                    if (fs.existsSync(audioPath)) {
                        const base64Audio = await fileToBase64(audioPath);
                        $audio.attr('src', base64Audio);
                        console.log('embed audio:', audioPath);
                    } else {
                        console.warn(`Audio not found: ${audioPath}`);
                    }
                })
        ]
    );

    // 输出处理后的 HTML 文件
    return $.html();
}

// 获取命令行参数
const args = process.argv.slice(2);
if (args.length !== 3) {
    console.error('Usage: node embedResources.js <workDir> <inputHtmlFile> <outputHtmlFile>');
    process.exit(1);
}

const [workDir, inputHtmlFile, outputHtmlFile] = args;
embedResources(workDir, inputHtmlFile)
    .then(value => {
        const outputFilePath = path.join(__dirname, outputHtmlFile);
        fs.writeFileSync(outputFilePath, value);
        console.log(`Output written to: ${outputFilePath}`);
    });
