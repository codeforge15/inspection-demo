module.exports = {
    apps: [
        {
            name: "my-react-app",
            script: "serve",
            env: {
                PM2_SERVE_PATH: './dist',    // 靜態檔案路徑
                PM2_SERVE_PORT: 3000,        // 埠號
                PM2_SERVE_SPA: 'true',       // 開啟單頁應用模式
                PM2_SERVE_HOMEPAGE: '/index.html'
            }
        }
    ]
}