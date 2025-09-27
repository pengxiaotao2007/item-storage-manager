# 物品存放管理系统

智能物品存放位置记录与查询管理系统，支持PWA安装到手机桌面。

## 功能特点

- 📱 PWA支持，可安装到手机桌面
- 🔍 智能物品查询和定位
- 📦 物品分类管理
- 📍 存放位置记录
- 🌐 多语言支持
- 📊 数据统计分析

## 技术栈

- React 19
- TypeScript
- Tailwind CSS
- Vite
- Supabase
- PWA

## 部署到 Vercel

### 自动部署（推荐）

1. Fork 这个仓库到你的 GitHub
2. 在 [Vercel](https://vercel.com) 注册账号
3. 点击 "New Project" 并选择你的仓库
4. 配置环境变量：
   - `VITE_PUBLIC_SUPABASE_URL`
   - `VITE_PUBLIC_SUPABASE_ANON_KEY`
5. 点击 Deploy

### 手动部署

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 上传 out 文件夹到 Vercel
```

## 环境变量

在 Vercel 项目设置中添加以下环境变量：

```
VITE_PUBLIC_SUPABASE_URL=your_supabase_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## PWA 安装

### Android 手机
1. 用 Chrome 浏览器打开网站
2. 点击弹出的"安装到桌面"提示
3. 确认安装

### iPhone
1. 用 Safari 浏览器打开网站
2. 点击分享按钮
3. 选择"添加到主屏幕"
4. 确认添加

## 许可证

MIT License