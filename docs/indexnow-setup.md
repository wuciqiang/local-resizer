# IndexNow 自动提交到 Bing

## 设置步骤

1. **IndexNow Key 已生成**：`4ca258e2-7679-4bfb-85fd-97c5855d7a1a`
   - Key 文件已放在 `public/4ca258e2-7679-4bfb-85fd-97c5855d7a1a.txt`
   - 部署后可访问：`https://localresizer.com/4ca258e2-7679-4bfb-85fd-97c5855d7a1a.txt`

2. **本地提交（手动）**：
   ```bash
   npm run build
   INDEXNOW_KEY=4ca258e2-7679-4bfb-85fd-97c5855d7a1a npm run submit-indexnow
   ```

3. **Cloudflare Pages 自动提交（推荐）**：

   在 Cloudflare Pages 项目设置中添加环境变量：
   - 变量名：`INDEXNOW_KEY`
   - 值：`4ca258e2-7679-4bfb-85fd-97c5855d7a1a`

   然后使用 `build:deploy` 脚本触发“构建 + 提交”：
   ```json
   "build": "astro build",
   "build:deploy": "npm run build && npm run submit-indexnow"
   ```

4. **验证**：
   - 部署后访问 `https://localresizer.com/4ca258e2-7679-4bfb-85fd-97c5855d7a1a.txt` 确认 key 文件可访问
   - 查看构建日志确认 IndexNow 提交成功

## Google Search Console

1. 进入 [Google Search Console](https://search.google.com/search-console)
2. 添加资源：`https://localresizer.com`
3. 验证所有权（推荐使用 DNS TXT 记录）
4. 提交 sitemap：`https://localresizer.com/sitemap-index.xml`

## 注意事项

- IndexNow 支持 Bing、Yandex 等搜索引擎
- 普通 `npm run build` 只负责构建，不应带外部副作用
- 只有 `npm run build:deploy` 或显式执行 `npm run submit-indexnow` 才会向 IndexNow 提交
- 无需重复提交未变化的页面（IndexNow 会自动去重）
