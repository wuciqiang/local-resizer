# LocalResizer — 模块文档（当前实现）

> 本文档描述当前仓库中的**已实现结构**。  
> 若与规划文档冲突，请以 `src/data/routes.ts` 和 `docs/current-public-capabilities.md` 为准。

## 架构概览

Astro 5.x SSG + React 19 岛屿 + Tailwind CSS 4，纯前端图片处理，零服务器上传。

```text
src/
├── components/              # Astro 组件 + React 岛屿
│   └── image-processor/     # ImageProcessor 拆分后的子组件与工具
├── data/routes.ts           # 当前上线路由矩阵（唯一 live route 源）
├── layouts/                 # BaseLayout（全局布局 + SEO 注入）
├── lib/
│   ├── compress.ts          # 目标体积压缩引擎
│   ├── resize.ts            # 目标尺寸 / 精确画布引擎
│   ├── image/               # canvas / geometry 共享辅助
│   ├── content.ts           # 页面内容生成
│   └── seo.ts               # JSON-LD / canonical 生成
├── pages/                   # 首页、动态工具页、静态说明页
└── styles/                  # 全局样式
```

## 模块说明

### `src/data/routes.ts` — 当前上线路由矩阵

核心数据层，负责生成当前已发布页面。

- **类型定义**：`RouteConfig`, `SEOMeta`, `FaqItem`, `Action`, `Format`
- **路由家族**：
  - `compress-{format}-to-{size}`
  - `resize-image-to-{size}`
  - `resize-{platform}-{asset}`
- **当前导出**：
  - `activeRoutes`：当前 live 路由全集
  - `phase0Routes`：当前 live 路由别名，便于页面语义表达
  - `getRouteBySlug()`
- **当前发布开关**：`PHASE0_SLUGS`

### `src/lib/compress.ts` — 压缩引擎

- JPEG / WebP：通过二分搜索 quality 逼近目标体积
- PNG：优先重编码，再按策略选择转 WebP 或缩放尺寸
- 返回最接近目标的候选结果，并附带说明文本

### `src/lib/resize.ts` — 缩放引擎

- 支持目标尺寸缩放
- 支持精确画布导出（平台尺寸页）
- 支持面向目标体积的缩放 + 压缩组合策略

### `src/lib/image/` — 共享图像工具

- `canvas.ts`：`loadImage` / `canvasToBlob` / `resetCanvas`
- `geometry.ts`：contain / cover 缩放比例与尺寸计算

### `src/components/ImageProcessor.tsx` — React 岛屿入口

职责：

- 管理文件、状态、进度、错误和结果
- 按模式调度 `compress.ts` 或 `resize.ts`
- 组合以下子模块：
  - `UploadDropzone`
  - `ConfigPanel`
  - `SelectedFilesPanel`
  - `ProgressPanel`
  - `ResultsPanel`

### `src/lib/content.ts` / `src/lib/seo.ts`

- `content.ts`：根据 route config 生成 intro / detail / highlights / format info
- `seo.ts`：生成 HowTo、FAQ、canonical 等结构化输出

## 当前公开能力边界

以 `docs/current-public-capabilities.md` 为准，当前 live scope 是：

- 仅支持静态 JPEG / PNG / WebP
- 不支持 GIF / video / AI 编辑
- 当前平台专用页仅覆盖已发布的 live pages

## 推荐验证命令

```bash
npm run typecheck
npm run test
npm run test:image
npm run build
```
