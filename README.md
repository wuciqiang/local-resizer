# LocalResizer - 浏览器端图片处理工具

> 隐私优先的在线图片压缩和调整大小工具，所有处理完全在浏览器本地完成，零上传。

[![部署状态](https://img.shields.io/badge/部署-Cloudflare%20Pages-orange)](https://localresizer.com)
[![技术栈](https://img.shields.io/badge/技术栈-Astro%205%20%2B%20React%2019-blue)](https://astro.build)
[![许可证](https://img.shields.io/badge/许可证-MIT-green)](LICENSE)

> 当前已上线能力请以 `src/data/routes.ts` 与 `docs/current-public-capabilities.md` 为准。  
> `PRD.md` 主要用于规划，不代表当前已经发布的功能。

## 🌟 核心特性

### 隐私保护
- **零上传**：所有图片处理在浏览器本地完成，文件永不离开你的设备
- **本地处理**：所有图片处理都在浏览器内完成，但当前版本**不是**完整 PWA，不能承诺首次打开后可完全离线使用
- **无需注册**：无需账号，无需登录，打开即用

### 强大功能
- **智能压缩**：支持 JPEG、PNG、WebP 三种格式
  - PNG 压缩提供两种策略：转 WebP（保持尺寸）或缩放尺寸
  - 用户可自主选择压缩方式
  - 实时进度显示
- **精确调整**：支持按文件大小或像素尺寸调整
  - 主页工具：自由输入目标尺寸或文件大小
  - 专用页面：当前已上线的是部分固定场景页（如 YouTube banner / thumbnail），更多平台页面仍在规划中
- **批量处理**：一次最多处理 20 个文件
- **格式变化提示**：当 PNG 选择转 WebP 等策略时，会清晰标注输出格式变化

### 技术亮点
- **pSEO 架构**：参数化路由配置，一套引擎支持无限页面扩展
- **Canvas API**：纯前端图片处理，无需后端服务器
- **响应式设计**：完美适配桌面和移动设备
- **Tailwind 4**：现代化 UI 设计系统

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm（仓库提供 `package-lock.json`）

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/wuciqiang/local-resizer.git
cd local-resizer

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:4321
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 运行测试
npm run test
```

## 📁 项目结构

```
local-resizer/
├── src/
│   ├── components/          # React 组件
│   │   └── ImageProcessor.tsx  # 核心图片处理组件
│   ├── data/
│   │   └── routes.ts        # 路由配置（pSEO 核心）
│   ├── layouts/
│   │   └── BaseLayout.astro # 全局布局
│   ├── lib/
│   │   ├── compress.ts      # 压缩引擎
│   │   ├── resize.ts        # 调整大小引擎
│   │   ├── content.ts       # 内容生成
│   │   └── seo.ts           # SEO 元数据生成
│   ├── pages/
│   │   ├── index.astro      # 主页
│   │   └── [slug].astro     # 动态路由页面
│   └── styles/
│       └── global.css       # 全局样式（Tailwind 4）
├── public/                  # 静态资源
├── scripts/
│   └── submit-indexnow.js   # IndexNow 自动提交脚本
├── tests/                   # 测试文件
└── docs/                    # 文档
```

## 🎯 核心功能实现

### 1. PNG 压缩策略

PNG 格式不支持 quality 参数压缩，我们提供三种策略：

```typescript
// 策略 1: 原尺寸重编码（Canvas 重绘）
const pngRedrawn = await canvasToBlob(canvas, 'image/png', 1);

// 策略 2: 转 WebP（保持原尺寸，大幅减小体积）
const webpResult = await compressByQuality({
  format: 'image/webp',
  targetSizeBytes,
});

// 策略 3: 缩放尺寸（最后手段）
const scalingResult = await compressPngByScaling({
  targetSizeBytes,
});
```

用户上传 PNG 文件后，会弹出选择横幅：
- **转 WebP（推荐）**：保持原始尺寸，体积大幅减小
- **保持 PNG**：可能需要缩小尺寸才能达到目标体积

### 2. 统一处理路径

所有"目标文件体积"类页面（`compress-*-to-*` 和 `resize-image-to-*`）都走同一条 `compressImage` 路径，确保功能一致性：

```typescript
// compress-jpeg-to-100kb 和 resize-image-to-100kb 使用相同引擎
if (effectiveTargetSizeBytes) {
  const result = await compressImage({
    file,
    targetSizeBytes: effectiveTargetSizeBytes,
    pngStrategy: userChoice,
    onProgress: (percent) => setProgress(percent),
  });
}
```

### 3. pSEO 架构

通过 `routes.ts` 参数化配置，零代码新增页面：

```typescript
// 新增一个页面只需在 PHASE0_SLUGS 添加一行
const PHASE0_SLUGS = new Set([
  'compress-jpeg-to-100kb',
  'compress-png-to-100kb',
  'resize-image-to-100kb',
  'resize-youtube-thumbnail',
  // 新增页面 ↓
  'compress-webp-to-200kb',  // 自动继承所有功能
]);
```

## 🔧 技术栈

- **框架**：[Astro 5](https://astro.build) - 静态站点生成
- **UI 库**：[React 19](https://react.dev) - 交互式组件
- **样式**：[Tailwind CSS 4](https://tailwindcss.com) - 原子化 CSS
- **类型检查**：[TypeScript](https://www.typescriptlang.org) - 严格模式
- **测试**：[Vitest](https://vitest.dev) - 单元测试
- **部署**：[Cloudflare Pages](https://pages.cloudflare.com) - 全球 CDN

## 📊 SEO 优化

### Sitemap 自动生成
使用 `@astrojs/sitemap` 集成，每次构建自动生成 sitemap：
```
https://localresizer.com/sitemap-index.xml
```

### IndexNow 自动提交
每次部署后自动提交所有 URL 到 Bing：
```bash
npm run submit-indexnow
```

需要在 Cloudflare Pages 设置环境变量：
- `INDEXNOW_KEY`: `4ca258e2-7679-4bfb-85fd-97c5855d7a1a`

### 结构化数据
所有页面包含 JSON-LD 结构化数据：
- HowTo Schema（操作步骤）
- FAQ Schema（常见问题）
- WebSite Schema（网站信息）

## 🧪 测试

```bash
# 运行所有测试
npm run test

# 测试覆盖
- 路由配置验证（acceptFormats、FAQ、HowTo）
- SEO 元数据生成
- 内容生成逻辑
```

## 📈 分析追踪

使用 [Umami](https://umami.is) 进行隐私友好的访问统计：
- 无 Cookie
- 匿名数据
- GDPR 合规

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'feat: add some feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### Commit 规范
遵循 [Conventional Commits](https://www.conventionalcommits.org/)：
- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具链相关

## 📝 许可证

[MIT License](LICENSE) © 2026 LocalResizer

## 🔗 相关链接

- **官网**：https://localresizer.com
- **GitHub**：https://github.com/wuciqiang/local-resizer
- **问题反馈**：https://github.com/wuciqiang/local-resizer/issues

## 💡 设计理念

### 为什么选择浏览器端处理？

1. **隐私保护**：用户的图片永不上传到服务器，完全掌控自己的数据
2. **零成本**：无需服务器存储和计算资源，可持续运营
3. **即时响应**：无网络传输延迟，处理速度只受本地设备性能限制
4. **本地处理**：图片在浏览器本地处理，不依赖服务器上传；完整 PWA / 离线缓存仍在 roadmap 中

### 为什么选择 Astro？

1. **性能优先**：默认零 JavaScript，只在需要交互时加载 React
2. **SEO 友好**：完全静态生成，搜索引擎爬虫友好
3. **开发体验**：组件化开发，支持多种 UI 框架
4. **部署简单**：纯静态文件，可部署到任何 CDN

## 🎨 设计系统

### 颜色
- **主色调**：Teal（青色）- 代表清新、专业
- **辅助色**：Emerald（翠绿）- 代表成功、完成
- **警告色**：Amber（琥珀）- 代表提示、选择

### 字体
- **标题**：Inter（无衬线，现代感）
- **正文**：系统默认字体栈

### 动画
- **淡入**：`fade-up` - 元素从下方淡入
- **进度条**：平滑过渡，实时反馈
- **交互反馈**：hover/active 状态微动效

## 🚧 路线图

- [ ] 支持更多图片格式（AVIF、HEIC）
- [ ] 批量处理进度优化
- [ ] 图片编辑功能（裁剪、旋转、滤镜）
- [ ] PWA 支持（离线缓存、安装到桌面）
- [ ] 多语言支持（中文、日文、西班牙文）
- [ ] 暗色模式
- [ ] 图片质量对比预览

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- **GitHub Issues**：https://github.com/wuciqiang/local-resizer/issues
- **Email**：[待补充]

---

**⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！**
