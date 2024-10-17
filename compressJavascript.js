const babel = require("@babel/core");
const Terser = require("terser");
const fs = require("fs");
var compress = async (data) => {
    var result = data;
    try {
        result = (
            await babel.transformAsync(result, {
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
                    require('./babel-replace-this-expression-plugin')//替换顶层this表达式
                ]
            })
        ).code;
    } catch (e) {
        console.error('babel js发生错误:', e);
    }
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
    return result;
}
module.exports = compress;
if (require.main === module) {
    // console.log("当前模块是直接执行的");
    // 获取命令行参数
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node compressJavascript.js <inputFilePath> <outputFilePath>');
        process.exit(1);
    }
    var inputFilePath = args[0];
    var outputFilePath = args[1];
    (async () => {
        var fileContent = fs.readFileSync(inputFilePath, 'utf-8');
        fileContent = await compress(fileContent);
        fs.writeFileSync(outputFilePath, fileContent);
    })();
} else {
    // console.log("当前模块是被 require 的");
}