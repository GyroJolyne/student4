# 页面实现

首页结构见 pages/home.html 第 1 行起的 Webflow 导出内容。搜索 data-gl="head" 可定位人物画布容器，data-rive-primary 标记入场画布。CSS 由各页面 head 内的本地样式表链接加载。

assets/app.js 是部署版本的打包脚本。搜索 window.landoGL 可定位场景参数及资源路径。桌面分支读取 WebP，窄屏读取 KTX2。Rive 的 page-transition.riv 负责入场过渡。模型和纹理均通过同一个本地 HTTP 服务交付。

server.mjs 使用路由表将无扩展名地址映射到 pages 中的文件，允许直接访问和刷新子页。
