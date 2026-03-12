# LocalResizer — 模块文档

## 架构概览

Astro 5.x SSG + React 19 岛屿 + Tailwind CSS 4，纯前端图片处理，零服务器上传。

```
src/
├── components/     # Astro 组件 + React 岛屿
├── data/routes.ts  # 关键词矩阵 + 路由生成器（核心数据层）
├── layouts/        # BaseLayout（全局布局 + SEO 注入）
├── lib/            # 压缩/resize/SEO/内容引擎
├── pages/          # Astro 页面（动态路由 + 静态页）
└── styles/         # Tailwind 入口
```

## 模块说明

### `src/data/routes.ts` — 路由矩阵引擎

核心数据层，程序化生成所有路由配置。

- **类型定义**: `RouteConfig`, `SEOMeta`, `FaqItem`, `Action`, `Format`
- **矩阵常量**: `FORMATS`, `SIZE_TIERS_KB/MB`, `PLATFORM_ASSETS`
- **生成器**: `generateCompressRoutes()`, `generateResizeImageRoutes()`, `generatePlatformRoutes()`
- **内链**: `buildRelatedLinks()` — 同格式/同尺寸/同平台互链
- **导出**: `allRoutes`(全量), `phase0Routes`(Phase 0 子集), `getRouteBySlug()`

Phase 0 导出 8 个 P0 页面，Phase 1 切换为 `allRoutes` 即可铺开全部 ~200 页。

### `src/lib/compress.ts` — 二分法压缩引擎

- `compressImage(options)`: JPEG/WebP/GIF 通过二分搜索 quality 参数逼近目标体积
- `compressByScaling()`: PNG 无 quality 参数，通过缩放尺寸逼近目标
- 容差 ±5%，最大 20 次迭代

### `src/lib/resize.ts` — 尺寸缩放引擎

- `resizeImage(options)`: 支持目标尺寸和目标体积两种模式
- 目标体积模式：先按面积比缩尺寸，再调用 compress 微调
- 默认保持宽高比

### `src/lib/seo.ts` — SEO Schema 生成

- `generateHowToSchema()`: HowTo JSON-LD
- `generateFAQSchema()`: FAQPage JSON-LD
- `generateCanonicalUrl()`: canonical URL

### `src/lib/content.ts` — 内容引擎

- `generateIntroText()`: 按路由类型生成差异化介绍文案
- `generateFormatInfo()`: 格式科普段落

### `src/components/ImageProcessor.tsx` — React 岛屿

状态机: `idle → processing → done | error`

功能: 拖拽上传、批量处理(≤20)、实时进度、下载、动态 import 压缩引擎。

### 页面路由

- `src/pages/index.astro` — 首页（品牌 + 工具入口）
- `src/pages/[slug].astro` — 动态路由（所有工具页）
- `src/pages/{about,privacy,terms,contact}.astro` — 静态页

## Phase 1 扩展指南

1. `src/pages/[slug].astro` 中将 `phase0Routes` 改为 `allRoutes`
2. 构建即自动生成全部 ~200 页 + sitemap
