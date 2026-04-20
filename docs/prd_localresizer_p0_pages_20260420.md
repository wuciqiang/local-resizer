# PRD: localresizer.com P0 关键词页面扩展

- `date`: `2026-04-20`
- `target project`: `G:\Workspace\local-resizer`
- `keyword source project`: `G:\Workspace\auto-game-keyword-tool`
- `status`: `implementation-aligned PRD`
- `scope`: 6 个 localresizer P0 关键词页面

## 1. 结论摘要

这份 PRD 已按 `G:\Workspace\local-resizer` 当前真实项目重写。不能把 6 个词都当成“只加一个 slug 就能上线”的同类页面处理。

当前项目是 Astro 5 + React 19 的静态站，核心页面由 `src/data/routes.ts` 生成，动态页面统一走 `src/pages/[slug].astro`，图片处理统一由 `src/components/ImageProcessor.tsx` 调用 `src/lib/compress.ts` 和 `src/lib/resize.ts`。当前 live scope 只支持静态 JPEG/PNG/WebP，不支持 GIF、PDF、视频、AI、服务器上传、账号、云存储。

6 个关键词按实现复杂度分为三组：

| group | keyword | recommended URL | implementation status | priority |
| --- | --- | --- | --- | --- |
| `A: 可快速承接` | `photo resizer 20kb` | `/photo-resizer-20kb` | 复用现有 `resize-image-to-20kb` 文件大小引擎，新增文档照片语义页 | P0 |
| `A: 已有页面需优化` | `resize youtube banner` | `/resize-youtube-banner` | 当前已上线，但代码行为和能力文档疑似不一致，先修正/确认 | P0 blocker |
| `B: 轻架构扩展` | `compress jpg file` | `/compress-jpg-file` | 当前缺少 generic JPG compressor route，需要新增 explicit/manual route 或静态页 | P0 |
| `B: 轻架构扩展` | `resize png` | `/resize-png` | 当前只有 PNG-to-size 压缩页，没有 generic PNG resize 聚合页 | P0 |
| `C: 中等功能扩展` | `signature resizer` | `/signature-resizer` | 需新增 document/signature preset、裁边或手动裁切能力；不能只复用通用压缩页 | P1 after A/B |
| `D: 新模块` | `splitter image` | `/image-splitter` | 当前 `Action` 类型只有 `compress | resize`，需要新增 splitter action/engine/UI | P2 after core |

本周最合理开发顺序使用 `order 0` 开始计数，表示“正式新增页面前必须先完成的修正”：

0. 先修正 YouTube 平台页的实际行为与公开文案一致性，范围包括 `/resize-youtube-banner` 和 `/resize-youtube-thumbnail`。
1. 新增 `/photo-resizer-20kb`，复用现有 20KB target-size 引擎。
2. 新增 `/compress-jpg-file` 和 `/resize-png` 两个 SEO 承接页，但实现要贴合现有引擎，不虚构质量滑块、自由裁切或高级编辑能力。
3. `signature-resizer` 先做 MVP 规格，不要承诺具体政府/考试官方 preset。
4. `image-splitter` 单独作为新模块，不应混进 route matrix 的简单扩页里。

## 2. 项目实际现状

### 2.1 Source of truth

`local-resizer` 项目内已明确 source of truth 顺序：

1. `G:\Workspace\local-resizer\src\data\routes.ts`
2. `G:\Workspace\local-resizer\docs\current-public-capabilities.md`
3. `G:\Workspace\local-resizer\README.md`

`G:\Workspace\local-resizer\PRD.md` 是历史/规划文档，不能当成已上线能力依据。

### 2.2 当前 live route 架构

真实动态页入口：

- `src/pages/[slug].astro`
- `src/data/routes.ts`
- `src/data/route-constants.ts`
- `src/data/route-builders.ts`
- `src/data/route-types.ts`

当前 `RouteConfig` 支持字段：

```ts
export type Action = 'compress' | 'resize';
export type Format = 'jpeg' | 'png' | 'webp';
export type ResizeMode = 'fit' | 'contain' | 'cover' | 'stretch';

export interface RouteConfig {
  slug: string;
  action: Action;
  format?: Format;
  targetSize?: string;
  targetSizeBytes?: number;
  platform?: string;
  asset?: string;
  dimensions?: Dimensions;
  resizeMode?: ResizeMode;
  forceCanvasSize?: boolean;
}
```

当前生成的 route family 只有三类：

- `compress-{format}-to-{size}`
- `resize-image-to-{size}`
- `resize-{platform}-{asset}`

当前 active slugs 只有 8 个：

- `compress-jpeg-to-50kb`
- `compress-jpeg-to-200kb`
- `compress-png-to-200kb`
- `resize-image-to-20kb`
- `resize-image-to-100kb`
- `resize-image-to-2mb`
- `resize-youtube-banner`
- `resize-youtube-thumbnail`

这意味着：

- `/resize-youtube-banner` 已存在，不是新页面。
- `/photo-resizer-20kb` 可复用 `resize-image-to-20kb` 的处理逻辑，但需要新语义页。
- `/compress-jpg-file` 不符合当前生成模式，因为项目统一使用 `jpeg` 格式名，且现有压缩页都是 `to-{size}`。
- `/resize-png` 不符合当前生成模式，因为当前 PNG live 页是 `compress-png-to-200kb`，不是泛化 resize PNG 页。
- `/signature-resizer` 没有 route family 和专用交互。
- `/image-splitter` 完全超出当前 action 类型。

### 2.3 当前图片处理能力

真实处理引擎：

- `src/lib/compress.ts`
- `src/lib/resize.ts`
- `src/lib/image/canvas.ts`
- `src/lib/image/geometry.ts`

当前可承诺能力：

- 静态 JPEG/PNG/WebP。
- 浏览器本地处理，无图片上传服务器。
- `compressImage` 支持按目标文件大小压缩。
- JPEG/WebP 用 quality search 接近目标大小。
- PNG 不走 JPEG 式质量滑块；可能重编码、转 WebP，或缩小像素尺寸。
- `resizeImage` 支持按固定尺寸输出或按目标文件大小缩小。
- 固定尺寸页面支持 exact canvas。
- 批量最多 20 个文件。

当前不可承诺能力：

- GIF/animated GIF。
- PDF。
- 视频。
- AI 编辑。
- 官方证件/考试合规。
- 服务器端处理。
- 账号、云存储。
- 自动智能裁切。

### 2.4 当前组件限制

核心 React island：

- `src/components/ImageProcessor.tsx`
- `src/components/image-processor/ConfigPanel.tsx`
- `src/components/image-processor/SelectedFilesPanel.tsx`
- `src/components/image-processor/ResultsPanel.tsx`
- `src/components/image-processor/types.ts`

当前 `ImageProcessor` 有两种模式：

| mode | trigger | behavior |
| --- | --- | --- |
| configurable | 没有 `targetSizeBytes` 且没有 `dimensions` | 首页使用，用户可选 compress/resize，自填目标 |
| fixed | route 传入 `targetSizeBytes` 或 `dimensions` | 具体 slug 页使用，页面锁定目标 |

这个限制直接影响 PRD：

- 泛化页 `/compress-jpg-file` 如果要让用户自由选择 KB 或质量，不能完全复用当前 fixed route，需要新增 route 配置能力或建独立 Astro 页。
- 泛化页 `/resize-png` 如果要让用户输入宽高/百分比，也不能只靠当前 `buildCompressRoute`。
- `signature-resizer` 需要签名裁边/白底/尺寸+KB组合能力，当前没有。
- `image-splitter` 需要新增 action、结果列表、ZIP 或多文件下载，当前没有。

## 3. 关键 blocker

### 3.1 YouTube 平台页行为与文案疑似不一致

当前文档和页面文案声称 exact canvas 页面：

- keeps the whole image visible
- may add padding
- does not auto-crop

但 `src/data/route-builders.ts` 中平台页 currently sets：

```ts
resizeMode: 'cover',
forceCanvasSize: true,
```

而 `src/lib/resize.ts` 中 `cover` 会使用 cover scale，源图比例不一致时可能被画布裁切。若公开承诺是“不裁切、保留全图、可能 padding”，则平台页应使用 `resizeMode: 'contain'`，或文案必须改为“填满画布，可能裁切”。

本 PRD 决策：Phase 0 同时修正 `/resize-youtube-banner` 和 `/resize-youtube-thumbnail`。这两个页面来自同一个 platform builder，且当前公开能力文档把 exact canvas 页统一描述为“保留完整图片、可能 padding、不自动裁切”。因此 `resizeMode: 'contain'` 应同时应用于 YouTube banner 和 YouTube thumbnail，而不是只改 banner。

不建议保留 thumbnail 为 `cover`，除非产品明确把 thumbnail 定义为“填满并可能裁切”。如果选择该方向，必须同步改 `docs/current-public-capabilities.md`、`src/lib/content/*` 中的 platform 文案和 FAQ，不能继续使用“不裁切”的声明。

验收：

- 对一张竖图处理 `/resize-youtube-banner`，输出仍为 `2560 x 1440`。
- 对一张竖图处理 `/resize-youtube-thumbnail`，输出仍为 `1280 x 720`。
- 图像主体完整可见。
- 画布可能有 padding。
- `docs/current-public-capabilities.md`、页面文案、实际输出一致。

## 4. 产品目标

1. 用最小源码改动承接 6 个已验证 P0 关键词。
2. 不突破当前 `static JPEG/PNG/WebP + browser-local` 的公开能力边界。
3. 先强化 existing-site SEO cluster，而不是盲目做新产品线。
4. 新增页面必须真实可用，不能只是内容页套关键词。
5. 每个新增 route 必须进入 sitemap、HowTo schema、FAQ schema、相关内链、首页/guide 导航。
6. 新增能力必须有对应测试，尤其 route matrix、content、image helper、dist smoke。

## 5. 非目标

- 不做 animated GIF。
- 不做 PDF。
- 不做视频。
- 不做 AI 修图、去水印、背景移除。
- 不做服务器上传。
- 不做账号或历史记录。
- 不做“官方政府/考试规格保证”。
- 不做大批量 pSEO 铺页；本轮只围绕 6 个 P0 关键词。

## 6. 页面需求

### 6.1 `/photo-resizer-20kb`

- `keyword`: `photo resizer 20kb`
- `type`: document-photo semantic route
- `implementation class`: 可快速承接
- `recommended action`: P0 先做

#### 当前项目适配判断

这个页面最适合先做，因为现有项目已经有：

- `resize-image-to-20kb`
- `resizeImage(... targetSizeBytes)`
- `STATIC_IMAGE_ACCEPT_FORMATS`
- target-size best-effort 文案体系
- 20KB 相关 FAQ/HowTo 生成能力

新增 `/photo-resizer-20kb` 不应写成全新引擎。它应该是 `resize-image-to-20kb` 的文档照片语义页，复用同一处理路径。

#### MVP 行为

- 接受静态 JPEG/PNG/WebP。
- 默认目标文件大小为 20KB。
- 保持当前 best-effort 语义：尽量接近 20KB，不保证精确等于 20KB。
- 已小于 20KB 的图片保持原文件，不强制二次压缩。
- 不承诺证件照裁切、背景替换、官方规格校验。

#### 推荐实现

优先方案：扩展 route matrix 支持 explicit semantic aliases。

涉及文件：

- `src/data/route-types.ts`
- `src/data/route-constants.ts`
- `src/data/route-builders.ts`
- `src/data/route-faq.ts`
- `src/lib/content/page-copy.ts`
- `src/lib/content/highlights.ts`
- `src/lib/content/context-sections.ts`
- `src/lib/site-structure.ts`
- `docs/current-public-capabilities.md`
- `tests/routes.test.ts`
- `tests/content.test.ts`
- `scripts/check-dist.js`

建议新增 route config 字段：

```ts
intent?: 'generic' | 'document-photo' | 'signature' | 'format-resize' | 'generic-compress';
```

`photo-resizer-20kb` 可配置为：

```ts
{
  slug: 'photo-resizer-20kb',
  action: 'resize',
  targetSize: '20kb',
  targetSizeBytes: parseSize('20kb'),
  intent: 'document-photo',
  acceptFormats: STATIC_IMAGE_ACCEPT_FORMATS,
}
```

#### SEO

- `title`: `Photo Resizer 20KB Online - Private Browser Tool | LocalResizer`
- `H1`: `Photo Resizer 20KB`
- `description`: `Resize a static photo toward a 20KB upload limit in your browser. No image upload, no signup, and best-effort local processing.`

#### FAQ 要点

- How do I resize a photo to 20KB?
- Can every photo become exactly 20KB?
- Is this safe for government or exam upload photos?
- Are my photos uploaded?
- Which formats are supported?

#### 验收标准

- `/photo-resizer-20kb` 构建后存在。
- sitemap 包含该 URL。
- 页面首屏渲染 `ImageProcessor`。
- 上传 JPG/PNG/WebP 能触发 target-size 流程。
- HowTo schema 3 步。
- FAQ schema >= 5 条。
- 文案包含 best-effort，不包含 official guarantee。

### 6.2 `/resize-youtube-banner`

- `keyword`: `resize youtube banner`
- `type`: existing live route
- `implementation class`: 已有页面需修正/增强
- `recommended action`: P0 blocker

#### 当前项目适配判断

该 URL 已在 `PHASE0_SLUGS` 中上线。当前任务不是“新增页面”，而是：

1. 修正实际输出模式与公开声明一致性。
2. 强化页面对关键词 `resize youtube banner` 的 SEO 承接。
3. 可选增加 safe-area 文案，但不要承诺当前 UI 有可视化安全区，除非实际实现。

#### MVP 行为

保守版本：

- 输出 `2560 x 1440` exact canvas。
- 使用 `contain` 保留完整图片，必要时加 padding。
- 不自动裁切。
- 支持静态 JPEG/PNG/WebP。
- 不支持 GIF/video。

如果产品决定使用 `cover`，则必须改公开文案：

- 说明图片会填满 YouTube banner 画布。
- 源图比例不匹配时可能裁切。
- 不再宣称 keeps whole image visible。

#### 推荐实现

建议优先保持当前能力文档不变，修正代码：

- `src/data/route-builders.ts`
  - 当前 active platform routes 只有 YouTube banner 和 YouTube thumbnail，因此平台页默认 `resizeMode` 从 `cover` 改为 `contain` 即可覆盖两者。
  - 如果未来启用 Instagram/Discord 等其他 platform routes，应在 route config 上显式决定每个平台的 `resizeMode`，不要让未来平台隐式继承 YouTube 的产品语义。
- `tests/content.test.ts`
  - 增加 platform 页面实际行为文案测试。
- `tests/image-geometry.test.ts`
  - 补 banner/thumbnail contain 用例，确认非目标比例图片不会被裁切。
- `docs/current-public-capabilities.md`
  - 确认 live tool claim 与实际一致。

#### SEO 增强

当前 title 由 platform route 生成，偏尺寸词：

```text
YouTube Banner Size: 2560x1440 Resizer - Free Tool | LocalResizer
```

可接受，但可以更贴近关键词：

```text
Resize YouTube Banner Online - 2560x1440 Channel Art Tool | LocalResizer
```

建议通过 `seoOverride` 或 explicit route copy 实现，而不是破坏所有 platform route 模板。

#### 验收标准

- `/resize-youtube-banner` 页面仍为 active route。
- 输出尺寸为 `2560 x 1440`。
- 公开文案与实际 resize mode 一致。
- `docs/current-public-capabilities.md` 同步。
- `npm run test:routes`、`npm run test:content` 通过。

### 6.3 `/compress-jpg-file`

- `keyword`: `compress jpg file`
- `canonical project format`: `jpeg`
- `type`: generic JPG/JPEG compressor page
- `implementation class`: 轻架构扩展
- `recommended action`: P0

#### 当前项目适配判断

当前已有：

- `/compress-jpeg-to-50kb`
- `/compress-jpeg-to-200kb`
- JPEG quality-search compression engine

但没有：

- `/compress-jpg-file`
- generic compressor route
- JPG alias route family
- fixed page中让用户自由选择 target KB 的能力

因此这个页面不应简单塞进 `compress-{format}-to-{size}` 生成器。它更适合做一个 explicit semantic route，默认打开 compressor，但允许用户选择目标 KB。

#### MVP 行为

- 只接受 `image/jpeg`。
- 页面命名使用用户搜索词 `JPG`，但内部仍可复用 `jpeg` format。
- 工具默认 action = `compress`。
- 默认 target size 可设为 `200KB`，但用户可改为 `20KB/50KB/100KB/200KB/custom`。
- 如果实现为固定 route 且无法配置，则最低限度应跳转/内链到 `compress-jpeg-to-50kb` 和 `compress-jpeg-to-200kb`，但这不是最佳方案。

#### 推荐实现

方案 A：新增 `ImageProcessor` forced configurable mode，推荐。

当前 `ConfigPanel` 已经支持 target size 输入、KB/MB 单位选择和 quick size presets，首页正在复用这套 UI。因此 `/compress-jpg-file` 不需要新增 target-size UI；主要工作是让 route 页可以进入“固定 action 但仍可配置 target size”的模式。

新增 props：

```ts
lockedAction?: 'compress' | 'resize';
defaultTargetSizeBytes?: number;
```

对 `/compress-jpg-file`：

- `action='compress'`
- `format='jpeg'`
- `acceptFormats=['image/jpeg']`
- `lockedAction='compress'`
- `defaultTargetSizeBytes=parseSize('200kb')`
- 不传固定 `targetSizeBytes`，让 ConfigPanel 显示 target size 控件。

同时需要让 `ConfigPanel` 隐藏 action tabs 或禁用切换。否则用户从 `/compress-jpg-file` 进入后可以切到 resize，会削弱该页面的关键词意图和测试确定性。推荐新增：

```ts
hideActionTabs?: boolean;
```

当 `lockedAction='compress'` 时：

- `toolAction` 初始化为 `compress`。
- `ConfigPanel` 只显示 target file size 控件。
- 不展示 `Compress / Resize` tabs。
- `getInitialSizeValue(defaultTargetSizeBytes)` 用来设置默认值。

方案 B：新增独立 `src/pages/compress-jpg-file.astro`。

优点是改动少；缺点是绕开 route matrix，相关 links/schema/smoke 需要单独维护。

本 PRD 推荐方案 A，保持 pSEO 架构一致。

#### 需要修改的真实文件

- `src/components/image-processor/types.ts`
- `src/components/ImageProcessor.tsx`
- `src/data/route-types.ts`
- `src/data/route-builders.ts`
- `src/data/route-constants.ts`
- `src/data/route-faq.ts`
- `src/lib/content/*`
- `tests/image-processor-utils.test.ts`
- `tests/routes.test.ts`
- `tests/content.test.ts`

#### SEO

- `title`: `Compress JPG File Online - Private JPG Compressor | LocalResizer`
- `H1`: `Compress JPG File Online`
- `description`: `Compress a JPG file in your browser with no upload. Choose a target size and download a smaller JPEG locally.`

#### 验收标准

- `/compress-jpg-file` 只接受 JPEG/JPG。
- 页面默认显示 compress target controls。
- 处理后输出仍为 JPEG。
- 不承诺 exact size。
- 相关链接指向 `compress-jpeg-to-50kb`、`compress-jpeg-to-200kb`、`photo-resizer-20kb`。

### 6.4 `/resize-png`

- `keyword`: `resize png`
- `type`: generic PNG resize page
- `implementation class`: 轻架构扩展
- `recommended action`: P0

#### 当前项目适配判断

当前已有：

- `Format = 'png'`
- `compress-png-to-200kb`
- `resizeImage` dimension engine
- 首页 configurable resize

但没有：

- `/resize-png`
- generic format resize route
- PNG-only configurable resize page
- percentage resize UI

所以 `/resize-png` 的 MVP 应先贴合当前能力：PNG-only resize by width/height，保持 aspect ratio 或 exact canvas 的策略必须明确。

#### MVP 行为

推荐最小上线版本：

- 只接受 `image/png`。
- 默认 action = `resize`。
- 默认尺寸输入为 `1280 x 720` 或保留当前 ConfigPanel 默认值。
- 用户可输入 width/height。
- 输出默认保持 PNG。
- 不承诺百分比 resize，除非 `ConfigPanel` 实际新增 percentage 控件。
- 不承诺透明背景永远不变，但应在 PNG 输出路径中尽量保留 alpha。

#### 需要先确认的产品决策

当前 homepage configurable resize 在 `ImageProcessor` 内使用：

```ts
resizeMode: isConfigurable ? 'cover' : resizeMode
forceCanvasSize: isConfigurable ? true : forceCanvasSize
```

这意味着 configurable resize 更像 exact canvas cover，而不是“保持比例缩小到目标宽高内”。如果 `/resize-png` 要符合用户对 resize PNG 的预期，建议改为：

- generic resize page 默认 `resizeMode='contain'` 或 `fit`
- 不强制 cover 裁切
- 如果要 exact canvas，文案必须说明可能裁切或 padding

PNG alpha 处理结论：从 `src/lib/resize.ts` 当前代码看，PNG 输出路径会保留 `outputType = 'image/png'`，`forceCanvasSize` 时 `fillCanvasBackground()` 对非 JPEG 默认使用 `transparent` 并 `clearRect()`，非 `forceCanvasSize` 时直接绘制到新 canvas 后以 `image/png` 导出。因此在默认 PNG 输出路径下，透明通道应被保留。这里不应写成模糊的“尽量保留 alpha”，而应作为当前代码事实，并补一个测试防止回归。

需要补的测试：

- 构造或 fixture 一个透明 PNG。
- 走 `resizeImage({ file, targetDimensions, forceCanvasSize: true, resizeMode: 'contain' })`。
- 读取输出 canvas 像素，确认 padding 区 alpha 为 `0`，或至少确认没有被填白。
- 如果测试环境难以直接读取真实 PNG alpha，则在 `resize.ts` 抽出 `getOutputType` / background fill 逻辑做单元测试。

#### 推荐实现

新增 route intent：

```ts
{
  slug: 'resize-png',
  action: 'resize',
  format: 'png',
  intent: 'format-resize',
  acceptFormats: ['image/png'],
  maxFileSize: 50 * 1024 * 1024,
}
```

并扩展 `ImageProcessor` 支持：

- locked resize action。
- default dimensions。
- optional `forceCanvasSize=false` for format resize。
- 确保 PNG 输出仍走 `image/png`。

#### SEO

- `title`: `Resize PNG Online - Private PNG Resizer | LocalResizer`
- `H1`: `Resize PNG Online`
- `description`: `Resize a PNG image in your browser with no upload. Adjust pixel dimensions locally and download a new PNG.`

#### 验收标准

- `/resize-png` 只接受 PNG。
- 页面默认显示 resize controls。
- 输出文件为 PNG。
- 源图透明区域在常见透明 PNG 上不被强制填白。
- 文案不承诺 PDF/SVG/GIF。

### 6.5 `/signature-resizer`

- `keyword`: `signature resizer`
- `type`: document signature workflow
- `implementation class`: 中等功能扩展
- `recommended action`: P1

#### 当前项目适配判断

这个词不能只靠 `resize-image-to-20kb` 做薄页承接。用户意图通常是：

- 签名图裁掉多余边距。
- 调整宽高。
- 控制 KB。
- 白底或透明底。
- 适配表单上传。

当前项目缺少：

- crop UI。
- 自动裁边。
- 手动裁边。
- 同时设置尺寸和 KB 的组合 workflow。
- signature-specific presets。

所以它不应作为第一批纯 route expansion 直接上线，除非先接受一个非常保守的 MVP。

#### MVP 版本选择

方案 A：保守上线，可本周做。

- 作为 `document image resize/compress` 语义页。
- 接受 JPG/PNG/WebP。
- 默认 target KB = 20KB 或 50KB。
- 提供 width/height 输入。
- 不做自动裁边。
- 明确说明：不生成签名、不验证签名、不保证官方规格。

方案 B：真正 signature resizer，推荐但需要更多开发。

- 新增 crop/trim module。
- 支持自动检测非白色/非透明边界。
- 支持用户微调 crop box。
- 支持输出指定宽高 + 目标 KB。
- 支持白底 JPG 和透明 PNG。

本 PRD 建议：若要追求 SEO 与用户满意度，选择方案 B；若只为快速试水，方案 A 必须在页面上明确能力边界。

#### 推荐实现文件

- `src/lib/image/trim.ts` 新增自动裁边 helper。
- `src/lib/image/geometry.ts` 扩展 crop rectangle helper。
- `src/components/image-processor/SignatureOptionsPanel.tsx` 新增签名选项。
- `src/components/ImageProcessor.tsx` 支持 `intent='signature'`。
- `src/data/route-faq.ts` 新增 signature FAQ。
- `tests/image-geometry.test.ts` 或新增 `tests/image-trim.test.ts`。

#### SEO

- `title`: `Signature Resizer Online - Resize Signature Image Privately | LocalResizer`
- `H1`: `Signature Resizer Online`
- `description`: `Resize and compress a signature image locally in your browser. Adjust upload size and dimensions without sending the image to a server.`

#### 验收标准

- 页面不声称官方支持 GDS/India Post/SSC。
- 页面不生成签名。
- 如果没有裁边能力，页面不能写“remove extra white space automatically”。
- 如果有裁边能力，必须有预览和取消/重置。
- 输出可下载，且仍在浏览器本地处理。

### 6.6 `/image-splitter`

- `keyword`: `splitter image`
- `canonical keyword`: `image splitter`
- `type`: new image utility module
- `implementation class`: 新 action / 新模块
- `recommended action`: P2

#### 当前项目适配判断

该需求无法复用当前 `Action = 'compress' | 'resize'`。必须新增：

- route action：`split`
- 处理引擎：把一张图切成多个 canvas/blob
- UI：行列输入、预览切分线、结果列表
- 下载：多文件逐个下载；ZIP 下载可作为增强

不建议为了关键词快速上线一个内容页，因为用户 intent 很强，落地后如果没有真实 split 功能会损害体验。

#### MVP 行为

- 接受静态 JPEG/PNG/WebP。
- 支持 `Grid` 模式。
- 用户输入 rows 和 columns。
- 默认 `3 x 3`。
- 页面生成 N 个结果文件。
- 第一版可以逐个下载；ZIP 是 P1 增强。
- 文件命名：`original-name-r1-c1.png` 这类稳定规则。

#### 推荐实现文件

- `src/data/route-types.ts`
  - `Action = 'compress' | 'resize' | 'split'`
- `src/lib/split.ts`
  - `splitImage({ file, rows, columns })`
- `src/components/ImageProcessor.tsx`
  - 或拆出 `ImageSplitterProcessor.tsx`
- `src/components/image-processor/SplitOptionsPanel.tsx`
- `src/components/image-processor/ResultsPanel.tsx`
  - 支持多结果命名与下载
- `src/data/route-builders.ts`
  - explicit route: `image-splitter`
- `tests/image-split.test.ts`
- `tests/routes.test.ts`
- `scripts/check-dist.js`

#### SEO

- `title`: `Image Splitter Online - Split Image into Grid Pieces | LocalResizer`
- `H1`: `Image Splitter Online`
- `description`: `Split a static image into rows, columns, or a grid in your browser. Preview pieces and download results locally.`

#### 验收标准

- `/image-splitter` 页面存在。
- 默认 `3 x 3` 能输出 9 个文件。
- 输出块尺寸总和与源图尺寸对应，无明显丢边。
- 页面主文案使用 `Image Splitter`，不要主打倒装词 `Splitter Image`。
- 不承诺 PDF split、video split、GIF frame split。

## 7. 建议实施方案

### 7.1 Phase 0: 修正现有 live 站一致性

目标：

- 先让现有 `/resize-youtube-banner` 行为、文案、能力文档一致。

改动：

- `src/data/route-builders.ts`
- `docs/current-public-capabilities.md`
- `tests/content.test.ts`
- 如需要，补 `tests/image-geometry.test.ts`

验收：

- `npm run test:routes`
- `npm run test:content`
- 手动处理一张非 16:9 源图，确认输出和文案一致。

### 7.2 Phase 1: 低风险语义页扩展

目标：

- `/photo-resizer-20kb`
- `/compress-jpg-file`
- `/resize-png`

推荐架构：

新增 explicit routes，而不是硬塞进现有三种 generated route family。

建议新增：

```ts
export type RouteIntent =
  | 'generic'
  | 'generic-compress'
  | 'format-resize'
  | 'document-photo'
  | 'signature'
  | 'image-splitter';
```

`intent` 字段用途边界：

- `intent` 仅用于 Astro 构建期/服务端渲染侧的 copy、FAQ、HowTo、hub mapping、related links、SEO override 生成。
- `intent` 不直接传入 `ImageProcessor`，不作为 React island 的运行时分支开关。
- 运行时行为差异通过显式 props 控制，例如 `lockedAction`、`defaultTargetSizeBytes`、`defaultDimensions`、`resizeMode`、`forceCanvasSize`、`acceptFormats`。
- 如果某个页面确实需要全新运行时行为，例如 `image-splitter`，应新增 action/processor，而不是滥用 `intent`。

并让 route builder 支持：

- generated routes：现有 pattern 继续保留。
- explicit routes：手工定义 SEO、FAQ、HowTo、processor defaults。

好处：

- 不破坏当前 pSEO 矩阵。
- 可以为关键词意图写更精准文案。
- 不需要为所有 format/size 组合都扩展。
- tests 能继续以 `PHASE0_SLUGS` 为准。

### 7.3 Phase 2: 文档/签名 workflow

目标：

- `/signature-resizer`

推荐先完成：

- trim/crop 能力。
- width/height + target KB 组合流程。
- signature-specific disclaimers。

如果不做 trim/crop，则暂不建议上线 `signature-resizer`，因为用户预期会明显高于普通 resize/compress。

### 7.4 Phase 3: Image splitter 新模块

目标：

- `/image-splitter`

必须新增 action/engine/UI，不建议作为 route 文案页上线。

## 8. 内链与信息架构

当前项目已有 guide hubs：

- `/compress-image`
- `/resize-image`
- `/youtube-image-sizes`

需要新增或调整：

| page | hub mapping |
| --- | --- |
| `/photo-resizer-20kb` | `/resize-image`，但文案定位为 document photo |
| `/compress-jpg-file` | `/compress-image` |
| `/resize-png` | `/resize-image` 或新增 format guide |
| `/signature-resizer` | 建议新增 `/document-image-tools` guide 或挂在 `/resize-image` |
| `/image-splitter` | 建议新增 `/image-tools` guide 或先挂首页工具列表 |
| `/resize-youtube-banner` | `/youtube-image-sizes`，保持当前 |

首页 `Current focused pages` 会遍历 `phase0Routes`，新增 active route 后自动展示。但如果新增静态 Astro 页而不是 route matrix 页，需要手动加入口。

## 9. 文案边界

所有新增页必须统一遵守：

- `static images only`
- `JPEG, PNG, WebP only`
- `processed locally in your browser`
- `no server upload`
- `best-effort file size`
- `not official / not certified`

禁止出现：

- `exactly 20KB guaranteed`
- `official passport/photo/signature requirement`
- `works with GIF`
- `works with PDF`
- `works with video`
- `AI`
- `cloud storage`
- `we upload/process your image on server`

## 10. 埋点建议

当前代码中没有看到具体 Umami event 调用，只在 README 和 privacy/about 文案中说明使用 privacy-friendly analytics。不要在 PRD 中假设已有事件系统。

如果要新增事件，建议作为独立技术任务：

| event | trigger |
| --- | --- |
| `tool_file_selected` | 用户成功选择文件 |
| `tool_process_started` | 点击处理按钮 |
| `tool_process_succeeded` | 处理成功 |
| `tool_process_failed` | 处理失败 |
| `tool_download_clicked` | 点击下载 |

事件 properties 只记录：

- `page_slug`
- `action`
- `input_type`
- `output_type`
- `file_count`
- `error_type`

不要记录：

- 文件名。
- 图片内容。
- 具体用户表单信息。

## 11. 测试计划

每个新增 route 至少更新：

- `tests/routes.test.ts`
- `tests/content.test.ts`
- `tests/seo.test.ts` 如 schema、canonical、breadcrumb 或 structured data 有变化。该文件当前已存在。
- `tests/site-structure.test.ts` 如 hub mapping、breadcrumbs、guide links 有变化。该文件当前已存在。
- `tests/image-processor-utils.test.ts` 如新增 `lockedAction`、default target size、download name、config parsing 等 util 行为。
- `tests/image-geometry.test.ts` 如改 YouTube contain/cover 行为、PNG alpha 或 splitter 几何逻辑。
- `scripts/check-dist.js`
- `docs/current-public-capabilities.md`

通用验证命令：

```bash
npm run test:routes
npm run test:content
npm run test:image
npm run typecheck
npm run build
npm run smoke:dist
```

完整发布前：

```bash
npm run verify
```

手动 QA：

- 桌面 Chrome：每个页面上传支持格式并下载。
- 移动 viewport：上传区域、配置面板、结果下载按钮可用。
- 非支持格式：显示清晰错误。
- 超大文件：触发 max size 错误。
- PNG 页面：透明 PNG 输出检查。
- YouTube banner：非目标比例图片输出检查。
- 20KB 页：无法精确达到目标时显示 best-effort note。

## 12. Definition of Done

### Phase 0 done

- `/resize-youtube-banner` 实际输出与公开文案一致。
- docs/current-public-capabilities 同步。
- 测试通过。

### Phase 1 done

- `/photo-resizer-20kb`、`/compress-jpg-file`、`/resize-png` 均可访问。
- 3 个页面进入 sitemap。
- 3 个页面进入首页工具列表或相关 guide。
- 每页有独立 title、description、H1、FAQ、HowTo。
- 每页首屏有真实工具，不是纯内容页。
- 支持格式和公开承诺一致。

### Phase 2 done

- `/signature-resizer` 有真实签名 workflow。
- 页面不承诺官方 preset。
- 如果声明裁边，则必须真的有裁边能力。

### Phase 3 done

- `/image-splitter` 有真实 split 功能。
- 默认 3x3 输出 9 个文件。
- 结果文件命名可理解。
- 不承诺非图片 split。

## 13. 最终排期建议

| order | task | reason |
| ---: | --- | --- |
| `0` | 修正/确认 `/resize-youtube-banner` resizeMode 与文案 | 已上线页面，先消除行为风险 |
| `1` | `/photo-resizer-20kb` | 最贴近现有 `resize-image-to-20kb`，收益/成本比最高 |
| `2` | `/compress-jpg-file` | 搜索意图强，但需 generic compressor route |
| `3` | `/resize-png` | 搜索量强，但需明确 generic PNG resize 行为 |
| `4` | `/signature-resizer` | 机会真实，但普通压缩页无法满足全部预期 |
| `5` | `/image-splitter` | 需求强，但属于新模块，不应挤进简单扩页 |

## 14. 这版 PRD 相对上一版的修正

- 不再假设所有 6 个页面都能直接复用同一个工具模板。
- 明确 `/resize-youtube-banner` 已上线，重点是修正/增强，不是新增。
- 明确 `local-resizer` 当前只支持 `Action = compress | resize`。
- 明确 `image-splitter` 需要新增 action/engine/UI。
- 明确 `signature-resizer` 需要裁边/组合 workflow，否则只能保守上线。
- 明确 `compress jpg file` 与项目内部 `jpeg` 命名差异。
- 明确 `resize png` 当前没有泛化 format resize route。
- 加入真实源码文件、测试文件、构建验证命令。
