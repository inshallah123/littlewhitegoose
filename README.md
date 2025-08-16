# 桌面日历应用

一个基于 Electron + React + TypeScript 构建的现代化桌面日历应用。

## ✨ 特性

- 🗓️ **完整的日历功能** - 月/周/日视图切换
- 💾 **本地数据存储** - SQLite 数据库持久化
- 🎨 **中文界面** - 完全本地化的用户界面
- ⚡ **热重载开发** - 实时代码更新
- 🚀 **跨平台支持** - Windows/macOS/Linux

## 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript
- **桌面应用**: Electron 37
- **UI组件库**: Ant Design 5.x
- **日历组件**: react-big-calendar
- **状态管理**: Zustand
- **样式解决方案**: styled-components
- **数据库**: SQLite (better-sqlite3)

## 📁 项目结构

```
calendar/
├── public/                 # Electron 主进程文件
│   ├── electron.js         # 主进程入口
│   ├── preload.js          # 预加载脚本
│   ├── database-service.js # 数据库服务
│   └── index.html          # HTML 模板
├── src/                    # React 渲染进程文件
│   ├── components/         # React 组件
│   │   └── Calendar.tsx    # 主日历组件
│   ├── services/           # 服务层
│   │   └── electronDB.ts   # Electron 数据库适配器
│   ├── store/              # 状态管理
│   │   └── calendarStore.ts # Zustand 状态存储
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts        # 通用类型
│   ├── App.tsx             # 主应用组件
│   └── index.tsx           # React 入口
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript 配置
├── .npmrc                  # npm 配置（Electron 中国镜像）
└── .gitignore              # Git 忽略文件
```

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run electron-dev
```

启动后会同时运行：
- React 开发服务器 (http://localhost:3002)
- Electron 桌面窗口

### 构建生产版本

```bash
npm run build
npm run electron-builder
```

## 🎯 功能说明

### 日历管理
- **视图切换**: 支持月/周/日三种视图模式
- **事件创建**: 点击空白区域或使用"新建日程"按钮
- **事件查看**: 点击已有事件查看详细信息
- **日期导航**: 上一个/下一个/今天按钮导航

### 快捷键
- `Ctrl+N`: 新建日程
- `Ctrl+1`: 月视图
- `Ctrl+2`: 周视图  
- `Ctrl+3`: 日视图
- `Ctrl+R`: 刷新
- `F12`: 开发者工具

### 数据存储
- 使用 SQLite 本地数据库
- 支持完整的 CRUD 操作
- 数据库文件位置: `%APPDATA%/desktop-calendar/calendar.db`

## 🔧 开发说明

### 添加新功能

1. **前端组件**: 在 `src/components/` 添加新组件
2. **数据操作**: 在 `src/store/calendarStore.ts` 添加新的状态和操作
3. **类型定义**: 在 `src/types/index.ts` 定义新的 TypeScript 类型
4. **数据库**: 在 `public/database-service.js` 添加新的数据库操作

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 React Hooks 最佳实践
- 使用 styled-components 进行样式管理
- 保持组件的单一职责原则

## 🐛 已知问题

- Electron 缓存权限警告（不影响功能）
- 首次启动可能需要等待依赖模块编译

## 📝 更新日志

### v1.0.0 (当前版本)
- ✅ 基础日历功能
- ✅ SQLite 数据持久化
- ✅ 完整中文界面
- ✅ 跨平台桌面应用

### 计划功能
- 🔔 桌面提醒功能
- ☁️ 云端同步支持
- 🎨 主题定制
- 📤 导入导出功能

## 📄 许可证

MIT License