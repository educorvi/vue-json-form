// eslint-disable-next-line no-unused-vars
const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const { VueLoaderPlugin } = require('vue-loader')


const commonConfig = {
    // entry: path.resolve(__dirname + '/src/components/FormRoot.vue'),
    output: {
        path: path.resolve(__dirname + '/dist/'),
        // filename: 'form-root.js'
    },
    plugins: [
        new VueLoaderPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false
                }
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: __dirname,
                exclude: /node_modules/
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    'css-loader'
                ],
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'sass-loader'
                ],
                exclude: /node_modules/
            }
        ]
    },
    optimization: {
        minimize: true
    },
    externals: {
        bootstrap: "bootstrap",
        "bootstrap-vue": "bootstrap-vue",
        "json-pointer": "json-pointer",
        jsonschema: "jsonschema",
        "vue-material": "vue-material",
        vuedraggable: "vuedraggable"
    },
    mode: 'production'
};

module.exports = [
    //Browser Environment
    merge(commonConfig, {
        entry: path.resolve(__dirname + '/src/plugin.js'),
        output: {
            filename: 'vue-json-form.min.js',
            libraryTarget: 'window',
            library: 'VueJsonForm'
        }
    }),
    //Node-based
    merge(commonConfig, {
        entry: path.resolve(__dirname+'/src/components/FormRoot.vue'),
        output: {
            filename: 'vue-json-form.js',
            libraryTarget: 'umd',

            // These options are useful if the user wants to load the module with AMD
            library: 'vue-json-form',
            umdNamedDefine: true
        }
    })
]
