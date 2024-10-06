//替换顶层this表达式
module.exports = function ({ types: t }) {
    return {
        visitor: {
            ThisExpression(path) {
                // 检查是否是顶层的 this
                if (!path.findParent((p) => p.isFunction() || p.isMethod())) {
                    path.replaceWith(t.identifier('window'));
                }
            },
        },
    };
};
