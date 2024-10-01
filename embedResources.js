//快速初步嵌入资源
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// 获取文件内容
function getFileContent(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
}

// 转换图片为 Base64
function imageToBase64(filePath) {
    const image = fs.readFileSync(filePath);
    return `data:image/${path.extname(filePath).slice(1)};base64,${image.toString('base64')}`;
}

// 转换音频为 Base64
function audioToBase64(filePath) {
    const audio = fs.readFileSync(filePath);
    const ext = path.extname(filePath).slice(1);
    const mimeType = ext === 'mp3' ? 'audio/mpeg' : `audio/${ext}`;
    return `data:${mimeType};base64,${audio.toString('base64')}`;
}

// 嵌入 JS、CSS、图片和音频资源
function embedResources(workDir, inputFileName, outputFileName) {
    const inputFilePath = path.join(workDir, inputFileName);
    const outputFilePath = path.join(__dirname, outputFileName);

    // 读取 HTML 文件
    const html = getFileContent(inputFilePath);
    const $ = cheerio.load(html);

    // 处理 <script> 标签
    $('script[src]').each((_, script) => {
        const $script = $(script);
        const src = $script.attr('src');
        console.log('script src:', src)
        const scriptPath = path.join(workDir, src);

        if (fs.existsSync(scriptPath)) {
            const scriptContent = getFileContent(scriptPath);
            $script.attr('src', null);
            $script.text(`\n${scriptContent}\n`);
        } else {
            console.warn(`Script not found: ${scriptPath}`);
        }
    });

    // 处理 <link> 标签 (CSS)
    $('link[rel="stylesheet"]').each((_, link) => {
        const $link = $(link);
        const href = $link.attr('href');
        console.log('link href:', href)
        const cssPath = path.join(workDir, href);

        if (fs.existsSync(cssPath)) {
            const cssContent = getFileContent(cssPath);
            $link.replaceWith(`<style>\n${cssContent}\n</style>`);
        } else {
            console.warn(`CSS not found: ${cssPath}`);
        }
    });

    // 处理 <img> 标签
    $('img[src]').each((_, img) => {
        const $img = $(img);
        const src = $img.attr('src');
        console.log('img src:', src)
        const imgPath = path.join(workDir, src);

        if (fs.existsSync(imgPath)) {
            const base64Image = imageToBase64(imgPath);
            $img.attr('src', base64Image);
        } else {
            console.warn(`Image not found: ${imgPath}`);
        }
    });

    // 处理 <audio> 标签
    $('audio[src]').each((_, audio) => {
        const $audio = $(audio);
        const src = $audio.attr('src');
        console.log('audio src:', src)
        const audioPath = path.join(workDir, src);

        if (fs.existsSync(audioPath)) {
            const base64Audio = audioToBase64(audioPath);
            $audio.attr('src', base64Audio);
        } else {
            console.warn(`Audio not found: ${audioPath}`);
        }
    });

    // 输出处理后的 HTML 文件
    fs.writeFileSync(outputFilePath, $.html());
    console.log(`Output written to: ${outputFilePath}`);
}

// 获取命令行参数
const args = process.argv.slice(2);
if (args.length !== 3) {
    console.error('Usage: node embedResources.js <workDir> <inputHtmlFile> <outputHtmlFile>');
    process.exit(1);
}

const [workDir, inputHtmlFile, outputHtmlFile] = args;
embedResources(workDir, inputHtmlFile, outputHtmlFile);
