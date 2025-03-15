import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts', // 入口文件
    output: [
        {
            file: './es/index.js',
            format: 'esm',  // 将软件包保存为 ES 模块文件
            sourcemap: true // 启用 sourcemap 生成
        },
        {
            file: './dist/index.js',
            format: 'cjs',  // CommonJS，适用于 Node 和 Browserify/Webpack
            exports: 'default',
            sourcemap: true // 启用 sourcemap 生成
        }
    ],
    watch: {  // 配置监听处理
        exclude: 'node_modules/**'
    },
    plugins: [
        // 使用插件 @rollup/plugin-babel
        babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**'
        }),
        typescript()
    ]
};