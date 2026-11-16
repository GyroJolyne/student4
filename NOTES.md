# Lando Norris 官网本地复刻

在本目录执行 `node server.mjs`，浏览器访问 http://127.0.0.1:4184/ 。启动动画就绪后，点击页面底部的 **Load Norris** 进入。服务只监听本机，可用 PORT 环境变量指定端口。

页面快照来自 https://landonorris.com/ ，设计及交互制作署名 OFF+BRAND。此项目保留原站 Webflow 页面、摄影、字体、Rive 和 WebGL 资源，用于本地查看。商店和社交账号链接仍指向原服务。赛历和成绩为抓取时的页面内容。

页面在 pages，动画入口在 assets/app.js，模型和纹理在 assets/gl，Rive 文件在 assets/rive，页面媒体与样式在 assets/site。RECON 内保留桌面原站、本地桌面和本地手机宽度的截图。

Chrome 已验证首页在 1440 和 390 像素宽度进入主画面，桌面滚动有效。On Track、Off Track 和 Calendar 均通过直接访问和入场检查。原站 Partnerships 路径返回 404，本地保留原站的错误页面。日历隐藏项的缺省图片使用透明占位。
