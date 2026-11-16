# 侯盟 | Personal Website

个人 AIGC 作品集，包含作品图片、视频、LORA 训练介绍及 ComfyUI 工作流展示。

预定子域名：student4.town-slacker.top。域名绑定和托管发布状态需在 Cloudflare Pages 中确认。

## 本地预览

安装 Node.js 后，在仓库根目录运行 `npm start`，浏览器访问 http://127.0.0.1:4184/ 。也可在 Windows 中双击 `打开作品集.cmd`。

页面及预先构建的资源已包含在仓库中，本地预览无需先安装 npm 依赖。修改 React / TypeScript 组件时，先运行 `npm ci`，再运行 `npm run build`。修改 `pages/home.html` 后，应同步更新根目录的 `index.html`。

## 文件结构

- `index.html`：静态托管入口，与 `pages/home.html` 保持同步。
- `assets/`：页面样式、脚本、图片、字体及视频。
- `pages/`、`server.mjs`：本地页面及预览服务器。
- `src/`、`components/`、`lib/`、`styles/`：动画组件源代码及构建样式。
- `NOTES.md`、`TEARDOWN.md`：项目早期复刻记录与实现说明。

## 发布约定

- 每人只使用自己的仓库，不修改主站仓库。
- 仓库采用 main 分支，入口文件是仓库根目录的 index.html。
- Cloudflare Pages 选择 Git 集成，静态站点无需安装依赖或构建命令，发布目录是仓库根目录。
- 首次接入和子域名绑定由域名管理员处理。以后更新自己仓库的 main 分支，由已配置的 Pages 自动发布。
- 仓库已包含完整作品集页面；上传代码与托管上线是两个独立步骤。

## 安全与内容边界
- 不需要服务器IP、SSH密钥、公钥或私钥。
- 禁止把主账号密码、API令牌、身份证、个人手机号或未获授权的素材提交进仓库。
- 不使用账号级 Pages Write 令牌作为单人权限：该权限可能影响同账号其他站点。
- 若未来需要登录、数据库或AI接口，应另行设计后端，不把秘密写进前端。
