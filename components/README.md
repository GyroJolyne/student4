# InkReveal 组件

本项目沿用 Node 静态服务。React 只挂载在首屏画布或独立示例页。运行时脚本、样式和两张人物图均从本站加载。

## 在项目目录运行

```powershell
npm ci
npm run build
npm start
```

开发依赖包含 TypeScript、esbuild、Tailwind CSS 3。构建会先检查 TSX 类型，再编译浏览器脚本和 CSS。已有预览服务运行时，只需重新构建并刷新页面。

## 文件位置

- `components/ui/ink-reveal.tsx` 是可复用的客户端组件。默认不传图片时，它擦开纯色遮罩，露出底图。
- `src/opening.tsx` 配置首页图片遮罩、笔触大小与淡出时间。底层两张图片沿用原首页的裁切。
- `src/demo.tsx` 演示默认遮罩。访问 `/assets/ink-reveal/demo.html` 可独立预览。
- `styles/globals.css` 是 React 部分的 Tailwind 样式入口。首屏以外的风雪背景样式在 `assets/ink/theme.css`。
- `components.json` 和 `tsconfig.json` 将 `@/components/ui` 指向项目根目录的 `components/ui`。这个目录让 shadcn CLI 生成文件的位置与组件导入路径一致。工具函数位于 `lib/utils.ts`。

该项目已完成 shadcn 的手动配置，无需再次初始化。对于尚未配置的新 React + TypeScript 项目，可先使用 `npx shadcn@latest init`，按提示选择 Tailwind 样式入口、启用 TSX，并将 UI 组件别名设为 `@/components/ui`。
