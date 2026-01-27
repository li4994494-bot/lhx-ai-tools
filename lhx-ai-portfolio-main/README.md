
# lhx's AI Portfolio - lhx个人网站

这是一个基于 iOS 风格设计的极简个人作品集网站，采用 Apple 官网般的质感展示 AI 项目。

## ✨ 特性
- **Apple 官网级视觉**：留白、圆角、1:1 响应式栅格布局（每行两列）。
- **iOS 交互体验**：磨砂玻璃质感、细腻的浮入动效。
- **自动化部署**：内置 GitHub Actions 脚本。

## 🚀 部署到 GitHub Pages (核心步骤)

1. **新建仓库**：在 GitHub 上创建一个新仓库（例如 `lhx-website`）。
2. **上传代码**：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```
3. **关键设置**：
   - 进入 GitHub 仓库的 **Settings** > **Pages**。
   - 在 **Build and deployment** > **Source** 下，下拉选择 **GitHub Actions**。
4. **验证**：
   - 点击 **Actions** 选项卡查看进度。
   - 部署完成后，上方会自动显示你的网站 URL。

## 🛠️ 本地预览
```bash
npm install
npm run dev
```

## 📁 数据更新
修改 `data/projects.ts` 即可实时更新首页的项目卡片内容。
