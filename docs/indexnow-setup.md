# IndexNow 安全提交指南

LocalResizer 的主要索引渠道是 **Cloudflare Crawler Hints**。IndexNow 仅作为需要手动触发的安全 fallback，用于显式通知搜索引擎新的、变更的、删除的或已重定向的 URL。

## 设置步骤

1. **IndexNow Key 已生成**：`4ca258e2-7679-4bfb-85fd-97c5855d7a1a`
   - Key 文件已放在 `public/4ca258e2-7679-4bfb-85fd-97c5855d7a1a.txt`
   - 部署后可访问：`https://localresizer.com/4ca258e2-7679-4bfb-85fd-97c5855d7a1a.txt`

2. **本地验证（dry-run，不发送请求）**：
   ```bash
   npm run submit-indexnow -- -- --url https://localresizer.com/some-page
   ```

3. **正式提交（必须显式确认）**：
   ```bash
   npm run submit-indexnow -- -- --url https://localresizer.com/page-a --url https://localresizer.com/page-b --confirm-submit
   ```

   > 当前 npm 运行时需要第二个 `--` 才能将 `--url` 等参数原样转发给 Node 脚本。

   提交前脚本会：
   - 校验所有 URL 必须属于 `localresizer.com`，且为 HTTPS、无凭据、无 fragment、非默认端口；`https://localresizer.com/` 首页也允许提交
   - 按输入顺序去重，并以 10,000 条为一批分批提交
   - 先 GET `https://localresizer.com/<key>.txt` 校验 key 文件内容完全匹配
   - 仅向 `https://api.indexnow.org/indexnow` 这个中性端点发送 POST；超过 10,000 条 URL 时会分成多个批次，每批一次 POST

4. **Cloudflare Pages 部署**：
   - `npm run build` 只构建，**绝不**调用 IndexNow。
   - `npm run build:deploy` 保留为兼容性命令，但同样只构建，不会自动提交。
   - 如需触发 IndexNow，请在构建完成后单独、显式地运行上面的 `--confirm-submit` 命令。

5. **验证**：
   - 部署后访问 `https://localresizer.com/4ca258e2-7679-4bfb-85fd-97c5855d7a1a.txt` 确认 key 文件可访问
   - 查看构建/提交日志确认 IndexNow 返回 200 或 202

## Google Search Console

1. 进入 [Google Search Console](https://search.google.com/search-console)
2. 添加资源：`https://localresizer.com`
3. 验证所有权（推荐使用 DNS TXT 记录）
4. 提交 sitemap：`https://localresizer.com/sitemap-index.xml`

## 注意事项

- IndexNow 支持 Bing、Yandex 等搜索引擎，但 **Cloudflare Crawler Hints 是首选索引渠道**。
- 只应提交真正有意义的新增、变更、删除或重定向 URL；不要重复提交未变化页面。
- `npm run build` 完全无副作用，不会因为构建而意外通知搜索引擎。
