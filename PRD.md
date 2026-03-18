# LocalResizer — 纯前端图片处理工具站 PRD (Spec 级)

**域名**：localresizer.com（Cloudflare Pages）
**定位**：纯前端图片处理工具站，主打隐私安全 + pSEO 长尾矩阵
**品牌口号**："Resize locally. Your files never leave your device."
**优先级**：P0
**版本**：2.0

> [!IMPORTANT]
> 本文件是**规划文档**，包含大量未来阶段设想，不代表当前已上线能力。  
> 判断 live scope 时，请优先使用：
> - `src/data/routes.ts`
> - `docs/current-public-capabilities.md`

---

## 1. 战略路径 — 农村包围城市

采用 4 级关键词体系，从零竞争长尾词切入，逐步向高竞争头部词推进。

### 1.1 Tier 分级

| Tier | 定位 | KD 范围 | Phase | 页面数 |
|------|------|---------|-------|--------|
| 4 | 长尾精准词（农村） | 0-15 | Phase 0-1 | ~176 |
| 3 | 中尾格式词（包围） | 15-30 | Phase 1 | ~20 |
| 2 | 短尾竞争词（外围） | 30-50 | Phase 2+ | ~10 |
| 1 | 头部品牌词（城市） | 50+ | Phase 3+ | 首页 |

### 1.2 Phase 1 目标关键词（CSV 验证）

| 关键词 | KD | 难度 | 优先级 |
|--------|-----|------|--------|
| resize image to 2mb | 0 | Easy | P0 |
| resize image to 20kb | 2 | Easy | P0 |
| resize youtube banner | 2 | Easy | P0 |
| resize image to 100kb | 5 | Easy | P0 |
| compress image to 20kb | 9 | Easy | P0 |
| resize youtube thumbnail | 11 | Medium | P1 |
| resize jpeg image | 14 | Medium | P1 |
| gif resizer for discord | 14 | Medium | P1 |
| resize gif online | 20 | Medium | P1 |
| resize png | 22 | Medium | P1 |
| compress jpeg to 200kb | 23 | Medium | P1 |
| resize gif file size | 24 | Medium | P1 |

### 1.3 Phase 2+ 预留关键词

| 关键词 | KD | 类型 |
|--------|-----|------|
| online gif cropper | - | 图片裁剪 |
| converter heic to pdf | 2 | 格式转换 |
| converter png em pdf | 7 | 格式转换 |
| video resizer no watermark | 6 | 视频处理 |
| free video resizer without watermark | 18 | 视频处理 |
| resize video for instagram | - | 视频处理 |

---

## 2. pSEO 关键词矩阵（程序化生成）

### 2.1 Tier 4A — compress-{format}-to-{size}（精确体积压缩）

格式 4 种 × 尺寸 34 档 = **136 页**

**格式**：jpeg, png, webp, gif

**尺寸档位**：
- KB 档（27）：10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1500, 2000
- MB 档（7）：1, 2, 3, 4, 5, 8, 10

**URL 示例**：`/compress-jpeg-to-50kb`、`/compress-png-to-200kb`、`/compress-webp-to-2mb`

### 2.2 Tier 4B — resize-image-to-{size}（通用图片调整）

**20 页**

尺寸档：20kb, 30kb, 50kb, 80kb, 100kb, 150kb, 200kb, 250kb, 300kb, 400kb, 500kb, 600kb, 800kb, 1mb, 1.5mb, 2mb, 3mb, 5mb, 8mb, 10mb

**URL 示例**：`/resize-image-to-20kb`、`/resize-image-to-2mb`

### 2.3 Tier 4C — resize-{platform}-{asset}（社交平台场景）

**~25 页**

| 平台 | 资产类型 | 推荐尺寸 |
|------|---------|----------|
| YouTube | banner | 2560×1440 |
| YouTube | thumbnail | 1280×720 |
| YouTube | channel-art | 2560×1440 |
| Instagram | post | 1080×1080 |
| Instagram | story | 1080×1920 |
| Instagram | profile-photo | 320×320 |
| Discord | avatar | 128×128 |
| Discord | gif | 256×256 (≤8MB) |
| Discord | emoji | 128×128 (≤256KB) |
| Discord | banner | 960×540 |
| Twitter/X | header | 1500×500 |
| Twitter/X | profile-photo | 400×400 |
| Twitter/X | post-image | 1200×675 |
| Facebook | cover | 820×312 |
| Facebook | profile | 170×170 |
| Facebook | event-cover | 1200×628 |
| LinkedIn | banner | 1584×396 |
| LinkedIn | profile-photo | 400×400 |
| TikTok | profile-photo | 200×200 |
| Twitch | banner | 1200×480 |
| Twitch | profile | 256×256 |
| Twitch | emote | 112×112 |
| WhatsApp | profile | 500×500 |
| Telegram | sticker | 512×512 |

**URL 示例**：`/resize-youtube-banner`、`/resize-discord-gif`、`/resize-instagram-story`

### 2.4 Tier 3A — resize-{format}（格式通用调整聚合页）

**5 页**：`/resize-jpeg`、`/resize-png`、`/resize-webp`、`/resize-gif`、`/resize-jpg`

每页作为聚合入口，链接到该格式下所有 Tier 4A 子页。

### 2.5 Tier 3B — compress-{format}（格式通用压缩聚合页）

**5 页**：`/compress-jpeg`、`/compress-png`、`/compress-webp`、`/compress-gif`、`/compress-jpg`

### 2.6 Tier 3C — {format}-resizer / {format}-compressor（工具品牌页）

**10 页**：`/jpeg-resizer`、`/png-resizer`、`/gif-resizer`、`/webp-resizer`、`/jpg-resizer`、`/jpeg-compressor`、`/png-compressor`、`/gif-compressor`、`/webp-compressor`、`/jpg-compressor`

### 2.7 Tier 2 — 短尾竞争词（Phase 2+）

`/image-resizer`、`/image-compressor`、`/photo-resizer`、`/bulk-image-resizer`、`/batch-compress-images`、`/online-image-resizer`、`/free-image-compressor`

### 2.8 Tier 1 — 首页

localresizer.com 定位 "resize image" / "image resizer online"，作为全站权重汇聚点。

### 2.9 首期页面总计

| 类别 | 页面数 |
|------|--------|
| Tier 4A compress-{format}-to-{size} | 136 |
| Tier 4B resize-image-to-{size} | 20 |
| Tier 4C resize-{platform}-{asset} | 25 |
| Tier 3 聚合页 + 品牌页 | 20 |
| 首页 | 1 |
| **合计** | **~202** |

---

## 3. URL 路由规范

### 3.1 Phase 1 路由模式

```
/                                    → 首页（Tier 1）
/compress-{format}-to-{size}         → 精确压缩页（Tier 4A）
/resize-image-to-{size}              → 通用调整页（Tier 4B）
/resize-{platform}-{asset}           → 平台场景页（Tier 4C）
/resize-{format}                     → 格式调整聚合页（Tier 3A）
/compress-{format}                   → 格式压缩聚合页（Tier 3B）
/{format}-resizer                    → 工具品牌页（Tier 3C）
/{format}-compressor                 → 工具品牌页（Tier 3C）
```

### 3.2 Phase 2+ 预留路由

```
/convert-{format1}-to-{format2}      → 格式转换（Phase 2）
/crop-{format}                       → 图片裁剪（Phase 2）
/resize-video-for-{platform}         → 视频处理（Phase 3）
/{lang}/[slug]                       → 多语言路由（Phase 2+）
/blog/{slug}                         → 博客文章（Phase 0）
/about                               → 关于页面（Phase 0）
/privacy                             → 隐私政策（Phase 0）
/terms                               → 服务条款（Phase 0）
/contact                             → 联系页面（Phase 0）
```

### 3.3 slug 命名规则

- 全小写，单词间用 `-` 连接
- 格式名统一：jpeg（非 jpg，但 jpg 做 301 重定向或别名路由）
- 尺寸统一：数字+单位无空格，如 `50kb`、`2mb`
- 平台名统一：全小写，如 `youtube`、`instagram`、`discord`

---

## 4. 页面结构规范

### 4.1 通用页面 DOM 结构（自上而下）

```
┌─────────────────────────────────────┐
│ Header（极简导航）                    │
├─────────────────────────────────────┤
│ Hero Dropzone（首屏核心转化区）        │
│  ├─ <h1> 动态标题                    │
│  ├─ 副标题（卖点强化）                │
│  └─ 拖拽上传框 + 🔒 隐私标识          │
├─────────────────────────────────────┤
│ ImageProcessor（React 岛屿）         │
│  ├─ 实时预览（原图 vs 处理后）         │
│  ├─ 进度条                           │
│  └─ 下载按钮                         │
├─────────────────────────────────────┤
│ How-to Section（3 步说明）            │
│  └─ HowTo Schema.org 结构化数据      │
├─────────────────────────────────────┤
│ FAQ Section（动态问答）               │
│  └─ FAQPage Schema.org 结构化数据    │
├─────────────────────────────────────┤
│ Footer Links（互链矩阵）             │
│  ├─ 同格式不同尺寸                    │
│  ├─ 同尺寸不同格式                    │
│  └─ 相关平台场景                      │
└─────────────────────────────────────┘
```

### 4.2 动态 TDK 生成规则

**Title 模板**：
- compress 页：`Compress {FORMAT} to {SIZE} — Free Online Tool | LocalResizer`
- resize-image 页：`Resize Image to {SIZE} Online Free | LocalResizer`
- platform 页：`Resize {PLATFORM} {ASSET} ({W}×{H}) — Free Tool | LocalResizer`
- 聚合页：`Resize {FORMAT} Online — Free {FORMAT} Resizer | LocalResizer`

**Description 模板**：
- `Free online tool to {action} {format} to {size}. No upload needed — processed 100% in your browser. Fast, secure, and private.`

**Canonical**：每页自身 URL，无重复。

### 4.3 Schema.org 结构化数据

每个工具页注入两种 Schema：

**HowTo**（3 步）：
1. Upload your {format} image
2. Set target {size/dimensions} and click Process
3. Download your optimized file

**FAQPage**（3-5 条，按路由类型动态生成）：
- compress 页：围绕"质量损失"、"精度"、"格式差异"
- resize 页：围绕"等比缩放"、"批量处理"、"分辨率"
- platform 页：围绕"平台要求"、"最佳实践"、"文件限制"

---

## 5. 技术架构

### 5.1 技术栈

| 层 | 选型 | 理由 |
|----|------|------|
| 框架 | Astro 5.x (SSG) | 零 JS 首屏、岛屿架构、内置 i18n/sitemap |
| 交互岛屿 | React 19 | 图片处理交互组件 |
| 样式 | Tailwind CSS 4 | 原子化 CSS、极小产物 |
| 图片压缩 | Canvas API + toBlob | 浏览器原生、零依赖 |
| GIF 处理 | gif.js / libgif | GIF 帧级操作 |
| 部署 | Cloudflare Pages | 免费、全球 CDN、自动 HTTPS |
| 包管理 | pnpm | 快速、磁盘高效 |

### 5.2 目录结构

```
src/
├── components/
│   ├── Header.astro              # 顶部导航
│   ├── HeroDropzone.astro        # 首屏拖拽上传+处理区
│   ├── HowToSection.astro        # 步骤说明（含 HowTo Schema）
│   ├── FaqSection.astro          # FAQ 区（含 FAQPage Schema）
│   ├── FooterLinks.astro         # 底部互链矩阵
│   ├── ImageProcessor.tsx        # React 岛屿：图片处理交互
│   ├── SEOHead.astro             # TDK + Schema.org + hreflang 注入
│   └── LanguageSwitcher.astro    # 语言切换器（Phase 2+）
├── data/
│   └── routes.ts                 # 关键词矩阵配置 + 路由生成器
├── i18n/
│   ├── en.json                   # 英文（默认，Phase 0 实现）
│   ├── zh.json                   # 中文（预留）
│   ├── ja.json                   # 日文（预留）
│   └── index.ts                  # i18n 工具：t(), getLocale()
├── lib/
│   ├── compress.ts               # 二分法质量压缩算法
│   ├── resize.ts                 # Canvas drawImage 尺寸缩放
│   ├── gif.ts                    # GIF 帧处理（Phase 1 后期）
│   ├── seo.ts                    # TDK/FAQ/Schema 动态生成
│   └── content.ts                # 页面文案模板引擎
├── layouts/
│   └── BaseLayout.astro          # 全局布局（含 SEOHead）
├── pages/
│   ├── index.astro               # 首页
│   ├── [slug].astro              # 动态路由（所有工具页）
│   ├── about.astro               # 关于（Phase 0）
│   ├── privacy.astro             # 隐私政策（Phase 0）
│   ├── terms.astro               # 服务条款（Phase 0）
│   ├── contact.astro             # 联系（Phase 0）
│   ├── blog/
│   │   ├── index.astro           # 博客列表（Phase 0）
│   │   └── [post].astro          # 博客文章（Phase 0）
│   └── [lang]/                   # 多语言路由（Phase 2+，预留目录）
│       ├── index.astro
│       └── [slug].astro
└── styles/
    └── global.css                # Tailwind 入口 + 全局样式
public/
├── robots.txt
├── favicon.svg
└── og-default.png                # 默认 OG 图片
astro.config.mjs                  # Astro SSG + sitemap + i18n
tailwind.config.mjs
package.json
tsconfig.json
```
### 5.3 多语言（i18n）架构

**路由规则**：
- 默认语言（英文）无前缀：`localresizer.com/compress-jpeg-to-50kb`
- 其他语言加前缀：`localresizer.com/zh/compress-jpeg-to-50kb`
- Astro 内置 i18n routing 支持此模式

**Astro i18n 配置**：
```javascript
// astro.config.mjs
export default defineConfig({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'ja'],
    routing: {
      prefixDefaultLocale: false
    }
  }
})
```

**Phase 0/1 只实现英文**，但架构预留：
- `src/i18n/` 目录和 `t()` 函数
- 所有用户可见文案通过 `t(key)` 引用，不硬编码
- SEO 引擎预留 `hreflang` 标签生成逻辑

**后续新增语言只需**：添加翻译 JSON → locales 数组加语言代码 → 路由自动生成。

### 5.4 核心数据结构 `src/data/routes.ts`

```typescript
// ---- 类型定义 ----

type Action = 'compress' | 'resize';
type Format = 'jpeg' | 'png' | 'webp' | 'gif';
type Tier = 1 | 2 | 3 | 4;

interface Dimensions {
  width: number;
  height: number;
}

interface SEOMeta {
  title: string;        // "Compress JPEG to 50KB — Free Online Tool | LocalResizer"
  description: string;  // meta description
  h1: string;           // "Compress JPEG to 50KB Instantly"
  subtitle: string;     // "Free, fast, 100% secure. Processed locally."
}

interface FaqItem {
  question: string;
  answer: string;
}

interface RouteConfig {
  slug: string;                    // "compress-jpeg-to-50kb"
  action: Action;
  format?: Format;
  targetSize?: string;             // "50kb" | "2mb"
  targetSizeBytes?: number;        // 51200 (编译时计算)
  platform?: string;               // "youtube"
  asset?: string;                  // "banner"
  dimensions?: Dimensions;
  tier: Tier;
  seo: SEOMeta;
  faq: FaqItem[];
  howToSteps: string[];            // 3 步说明
  relatedLinks: string[];          // 内链 slugs
  acceptFormats: string[];         // 该页接受的 MIME types
  maxFileSize: number;             // 最大上传体积 (bytes)
}

// ---- 矩阵常量 ----

const FORMATS: Format[] = ['jpeg', 'png', 'webp', 'gif'];

const SIZE_TIERS_KB = [10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100,
  120, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900,
  1000, 1500, 2000];

const SIZE_TIERS_MB = [1, 2, 3, 4, 5, 8, 10];

const PLATFORMS: Record<string, { asset: string; dimensions: Dimensions }[]> = {
  youtube:   [{ asset: 'banner', dimensions: { width: 2560, height: 1440 } },
              { asset: 'thumbnail', dimensions: { width: 1280, height: 720 } },
              { asset: 'channel-art', dimensions: { width: 2560, height: 1440 } }],
  instagram: [{ asset: 'post', dimensions: { width: 1080, height: 1080 } },
              { asset: 'story', dimensions: { width: 1080, height: 1920 } },
              { asset: 'profile-photo', dimensions: { width: 320, height: 320 } }],
  discord:   [{ asset: 'avatar', dimensions: { width: 128, height: 128 } },
              { asset: 'gif', dimensions: { width: 256, height: 256 } },
              { asset: 'emoji', dimensions: { width: 128, height: 128 } },
              { asset: 'banner', dimensions: { width: 960, height: 540 } }],
  twitter:   [{ asset: 'header', dimensions: { width: 1500, height: 500 } },
              { asset: 'profile-photo', dimensions: { width: 400, height: 400 } },
              { asset: 'post-image', dimensions: { width: 1200, height: 675 } }],
  facebook:  [{ asset: 'cover', dimensions: { width: 820, height: 312 } },
              { asset: 'profile', dimensions: { width: 170, height: 170 } },
              { asset: 'event-cover', dimensions: { width: 1200, height: 628 } }],
  linkedin:  [{ asset: 'banner', dimensions: { width: 1584, height: 396 } },
              { asset: 'profile-photo', dimensions: { width: 400, height: 400 } }],
  tiktok:    [{ asset: 'profile-photo', dimensions: { width: 200, height: 200 } }],
  twitch:    [{ asset: 'banner', dimensions: { width: 1200, height: 480 } },
              { asset: 'profile', dimensions: { width: 256, height: 256 } },
              { asset: 'emote', dimensions: { width: 112, height: 112 } }],
  whatsapp:  [{ asset: 'profile', dimensions: { width: 500, height: 500 } }],
  telegram:  [{ asset: 'sticker', dimensions: { width: 512, height: 512 } }],
};

// ---- 生成函数 ----

function generateRoutes(): RouteConfig[] {
  const routes: RouteConfig[] = [];
  // Tier 4A: compress-{format}-to-{size}
  // Tier 4B: resize-image-to-{size}
  // Tier 4C: resize-{platform}-{asset}
  // Tier 3:  聚合页 + 品牌页
  // 编译时调用，生成 ~200 条 RouteConfig
  return routes;
}

export const allRoutes = generateRoutes();
export function getRouteBySlug(slug: string): RouteConfig | undefined {
  return allRoutes.find(r => r.slug === slug);
}
```

### 5.5 图片处理引擎

#### compress.ts — 二分法质量压缩

```typescript
interface CompressOptions {
  file: File;
  targetSizeBytes: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  tolerance?: number;       // 精度容差，默认 0.05 (±5%)
  maxIterations?: number;   // 最大迭代次数，默认 10
}

interface CompressResult {
  blob: Blob;
  quality: number;          // 最终使用的 quality 值 (0-1)
  originalSize: number;
  compressedSize: number;
  iterations: number;
}

async function compressImage(options: CompressOptions): Promise<CompressResult>;
```

**算法流程**：
1. 将 File 绘制到 Canvas
2. 二分法搜索 quality 参数（初始范围 0.0-1.0）
3. 每次迭代调用 `canvas.toBlob(callback, format, quality)`
4. 比较产物体积与目标体积，调整搜索范围
5. 达到容差范围或最大迭代次数时返回
6. PNG 无 quality 参数时，通过缩放尺寸逼近目标体积

#### resize.ts — 尺寸缩放

```typescript
interface ResizeOptions {
  file: File;
  targetDimensions?: { width: number; height: number };
  targetSizeBytes?: number;  // 如果目标是体积，先缩尺寸再压质量
  maintainAspectRatio?: boolean;  // 默认 true
}

interface ResizeResult {
  blob: Blob;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

async function resizeImage(options: ResizeOptions): Promise<ResizeResult>;
```

**双重策略**（目标为体积时）：
1. 先按比例缩小尺寸（面积比 = 目标体积 / 原始体积）
2. 再用 compress.ts 微调质量参数
3. 确保最终体积在目标 ±5% 范围内

#### Web Worker 策略

- 文件 > 5MB 时自动转入 Worker 处理
- Worker 内执行 OffscreenCanvas 操作
- 主线程保持 UI 响应，通过 postMessage 更新进度

#### GIF 处理（Phase 1 后期）

- 使用 gif.js 解码/编码 GIF 帧
- 逐帧缩放后重新编码
- Discord GIF 特殊处理：确保 ≤ 8MB + 256×256

### 5.6 交互组件 ImageProcessor.tsx

**状态机**：
```
idle → uploading → processing → done
                              → error → idle
```

**功能清单**：
- 拖拽 / 点击上传（支持多文件）
- 实时预览：原图 vs 处理后（并排或叠加对比）
- 处理进度条（百分比 + 预估剩余时间）
- 文件信息展示：文件名、原始尺寸、处理后尺寸、压缩率
- 单文件下载 / 批量 ZIP 下载
- 批量处理：最多 20 张，队列式处理
- 错误处理：文件格式不支持、文件过大、处理失败
- 页面路由参数自动注入处理配置（format、targetSize、dimensions）

**Props 接口**：
```typescript
interface ImageProcessorProps {
  action: 'compress' | 'resize';
  format?: string;
  targetSizeBytes?: number;
  dimensions?: { width: number; height: number };
  acceptFormats: string[];
  maxFileSize: number;
}
```

### 5.7 SEO 引擎 `src/lib/seo.ts`

```typescript
function generateTitle(route: RouteConfig): string;
function generateDescription(route: RouteConfig): string;
function generateH1(route: RouteConfig): string;
function generateFAQ(route: RouteConfig): FaqItem[];
function generateHowToSchema(route: RouteConfig): object;    // JSON-LD
function generateFAQSchema(route: RouteConfig): object;       // JSON-LD
function generateRelatedLinks(route: RouteConfig, allRoutes: RouteConfig[]): string[];
function generateHreflangTags(route: RouteConfig, locales: string[]): string;
```

**内链策略**（generateRelatedLinks）：
- 同格式不同尺寸：`compress-jpeg-to-50kb` → `compress-jpeg-to-100kb`, `compress-jpeg-to-200kb`
- 同尺寸不同格式：`compress-jpeg-to-50kb` → `compress-png-to-50kb`, `compress-webp-to-50kb`
- 相关平台场景：`resize-youtube-banner` → `resize-youtube-thumbnail`
- 上级聚合页：`compress-jpeg-to-50kb` → `compress-jpeg`, `jpeg-compressor`

### 5.8 内容引擎 `src/lib/content.ts`

```typescript
function generateSubtitle(route: RouteConfig): string;
function generateIntroText(route: RouteConfig): string;       // 首屏下方简介
function generateHowToSteps(route: RouteConfig): string[];    // 3 步说明
function generateFormatInfo(format: string): string;           // 格式科普段落
function generatePlatformGuide(platform: string, asset: string): string; // 平台指南
```

**FAQ 差异化规则**：
- compress 页：质量损失、精度保证、格式特性、批量处理、隐私安全
- resize 页：等比缩放、分辨率影响、最佳实践、格式选择
- platform 页：平台官方要求、最佳尺寸、文件限制、上传技巧、常见错误
---

## 6. 性能指标

| 指标 | 目标 |
|------|------|
| Lighthouse Performance | ≥ 95 |
| Lighthouse SEO | ≥ 95 |
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| 首屏 JS | 0 KB（Astro 岛屿，交互组件按需加载） |
| 压缩引擎加载 | 用户拖入文件时动态 import |
| 单页 HTML 体积 | < 50KB（gzip 后） |

**优化策略**：
- Astro 岛屿架构：首屏纯 HTML/CSS，零 JS
- React 组件 `client:visible`：进入视口时才加载
- 压缩引擎 `dynamic import()`：用户交互时才加载
- Tailwind CSS purge：仅保留使用的类
- 图片资源：SVG 图标 + 内联 CSS，无外部图片请求
- 字体：system-ui 字体栈，零字体文件

---

## 7. 部署方案

**平台**：Cloudflare Pages

**构建流程**：
```bash
pnpm install
pnpm build          # astro build → 输出 dist/
```

**自动化**：
- `@astrojs/sitemap`：构建时自动生成 sitemap.xml（含全部 ~200 URL）
- `robots.txt`：允许全站抓取，指向 sitemap
- Cloudflare Pages 自动 HTTPS + HTTP/2 + Brotli 压缩
- 自定义域名 localresizer.com 已绑定 Cloudflare

**robots.txt**：
```
User-agent: *
Allow: /
Sitemap: https://localresizer.com/sitemap-index.xml
```

**Astro 配置要点**：
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://localresizer.com',
  output: 'static',
  integrations: [react(), tailwind(), sitemap()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'ja'],
    routing: { prefixDefaultLocale: false }
  }
});
```

---

## 8. SEO 合规策略（防 Google 惩罚）

Google 2024 年起打击 "scaled content abuse"，工具型 pSEO 风险最低，但需严守以下底线：

### 8.1 合规保障

| # | 策略 | 说明 |
|---|------|------|
| 1 | 每页有真实功能 | 不是纯内容页，用户可实际执行压缩/resize 并下载结果 |
| 2 | 功能参数差异化 | 不同路由的处理参数（目标体积、格式、尺寸）确实不同 |
| 3 | FAQ 差异化 | 每个路由生成与其格式/尺寸/场景相关的独特 FAQ，非简单换词 |
| 4 | 内链有逻辑 | 同格式不同尺寸互链、同尺寸不同格式互链，非随机堆砌 |
| 5 | 分批上线 | 先上核心页，监控 GSC 收录和排名正常后再扩展 |
| 6 | 相邻尺寸合并 | 避免 40kb/45kb/50kb 过于密集，保持合理间距 |
| 7 | 文本厚度 | 每页至少 300 字独特文本（How-to + FAQ + 格式说明） |
| 8 | 无隐藏内容 | 所有文本对用户可见，不做 display:none SEO 文本 |

### 8.2 参考案例

- **Zapier**：7 万+ pSEO 页面，每页有真实集成功能
- **Wise**：汇率转换页面，每页有实时数据
- **TinyPNG / iLoveIMG**：图片工具站，类似模式已被 Google 长期收录
- **Canva**：模板页面矩阵，每页有真实编辑功能

---

## 9. 分期里程碑

### Phase 0（Week 1-2）：内容基础 + AdSense 申请

**目标**：建立站点基础，申请 AdSense

**交付物**：
- 首页（品牌定位 + 核心工具入口）
- 5-8 个核心工具页（P0 关键词：compress-jpeg-to-50kb, resize-image-to-20kb, resize-image-to-2mb, resize-image-to-100kb, compress-image-to-20kb 等）
- 静态页面：About, Privacy Policy, Terms of Service, Contact
- 8-15 篇原创博客文章（800-1500 字）：
  - "JPEG vs PNG vs WebP: Which Format Should You Use?"
  - "How to Resize Images for YouTube Without Losing Quality"
  - "Complete Guide to Image Compression for Web"
  - "Discord Image Size Limits: Everything You Need to Know"
  - "Instagram Image Size Guide 2026"
  - 等
- 确保每个工具页有充足文本内容（How-to + FAQ + 格式说明 ≥ 300 字）
- 提交 Google AdSense 申请
- 提交 Google Search Console + sitemap

### Phase 1（Week 3-4，AdSense 通过后）：pSEO 长尾矩阵

**目标**：铺开 Tier 4/3 全部页面

**交付物**：
- Tier 4A compress-{format}-to-{size}：136 页
- Tier 4B resize-image-to-{size}：20 页
- Tier 4C resize-{platform}-{asset}：25 页
- Tier 3 聚合页 + 品牌页：20 页
- 总计新增 ≈ 192 页
- 监控 GSC 收录率，目标 > 80%

### Phase 2（Week 5-8）：格式转换 + GIF 专项

**目标**：扩展功能矩阵

**交付物**：
- convert-{format1}-to-{format2}：~30 页
- GIF 裁剪/压缩专项优化
- 批量处理增强（ZIP 下载）
- 多语言支持（中文、日文）
- Tier 2 竞争词页面

### Phase 3（Month 2+）：视频 + 品牌建设

**目标**：进入视频处理赛道

**交付物**：
- 视频 resize 功能（FFmpeg.wasm）
- resize-video-for-{platform} 路由
- Tier 1 头部词页面优化
- 博客/教程内容持续产出
- 付费功能探索（批量 API、高清导出）

---

## 10. 变现路径

### 阶段一（Phase 0）：AdSense 优先

用少量高质量页面（~20 页）申请 Google AdSense。通过后再扩展 pSEO 矩阵（已通过的站不会因加页面被取消）。

### 阶段二（Phase 1+）：多元变现

| 渠道 | 说明 |
|------|------|
| Google AdSense | 展示广告，工具页 RPM 预估 $3-8 |
| 联盟推广 | Canva Pro、Adobe、Photoshop 等图片工具 |
| 自有付费 | 批量处理（>20 张）、高清导出、API 接口 |

### 备选方案

如 AdSense 审核周期过长：Ezoic（门槛低）、Carbon Ads（开发者友好）、BuySellAds。

---

## 附录 A：排除的关键词类别

以下 CSV 中的关键词不符合 localresizer.com 域名定位，已排除：

| 类别 | 示例 | 排除原因 |
|------|------|---------|
| calculator 系列 (25条) | aspect ratio calculator | 计算器，非图片处理 |
| checker/editor/maker | image quality checker | 功能不匹配 |
| 物理产品 | cheap ring sizer | 非数字工具 |
| Linux 系统运维 | resize partition, resize xfs | 磁盘操作 |
| 编程 | resize vector c++ | 代码库 |
| 文档处理 | resize document, resize word | 非图片 |
| 音频/代码库 | compressor plugin, compressorjs | 非图片压缩 |
| CSS 工具 | box resizer tool | 开发工具 |

---

## 附录 B：Astro 动态路由实现参考

```typescript
// src/pages/[slug].astro
---
import { allRoutes, getRouteBySlug } from '../data/routes';
import BaseLayout from '../layouts/BaseLayout.astro';
import HeroDropzone from '../components/HeroDropzone.astro';
import ImageProcessor from '../components/ImageProcessor.tsx';
import HowToSection from '../components/HowToSection.astro';
import FaqSection from '../components/FaqSection.astro';
import FooterLinks from '../components/FooterLinks.astro';

export function getStaticPaths() {
  return allRoutes.map(route => ({
    params: { slug: route.slug },
    props: { route }
  }));
}

const { route } = Astro.props;
---

<BaseLayout seo={route.seo}>
  <HeroDropzone route={route} />
  <ImageProcessor
    client:visible
    action={route.action}
    format={route.format}
    targetSizeBytes={route.targetSizeBytes}
    dimensions={route.dimensions}
    acceptFormats={route.acceptFormats}
    maxFileSize={route.maxFileSize}
  />
  <HowToSection steps={route.howToSteps} />
  <FaqSection items={route.faq} />
  <FooterLinks links={route.relatedLinks} />
</BaseLayout>
```
