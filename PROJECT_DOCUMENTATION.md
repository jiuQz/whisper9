# iPhone AI Chat (Uchat) 项目全面技术文档

本文档全面梳理并详细记录了 `iPhone AI Chat` 项目的架构、实现功能、引用的库、核心逻辑及技术细节，确保无一丝一毫遗漏。

## 1. 项目概述
本项目是一个高度仿真的 iOS 风格 Web 应用程序。其核心功能是一个名为 **Uchat** 的 AI 聊天应用，允许用户创建、管理自定义 AI 智能体（Agent），并通过调用大语言模型（LLM）API 进行实时流式对话。整个应用包裹在一个高仿真的 iPhone 外壳UI中，并包含多个占位/演示性质的 iOS 子应用（如相册、音乐、Safari等）。

## 2. 核心技术栈与外部库
*   **核心语言:** HTML5, CSS3, 原生 JavaScript (Vanilla JS，无前端框架如 React/Vue)。
*   **外部库:** `Dexie.js` (版本 3.2.4)。用于封装 IndexedDB，提供基于 Promise 的异步本地数据库操作，极大地简化了本地数据的持久化存储。
*   **架构模式:** 模块化组件注入。通过全局变量 `window.AppRegistry` 数组，将各个子应用及设置页面的 HTML 模板与初始化逻辑（`init` 函数）注册并动态注入到 `index.html` 中。

## 3. 文件结构与模块职责

### 3.1 核心框架文件
*   **`index.html`:** 项目的入口文件。定义了 iPhone 的硬件外壳（刘海屏、状态栏、主屏幕、Dock 栏），引入 CSS 与 JS 文件。通过内联脚本遍历 `window.AppRegistry` 并渲染所有的页面组件。
*   **`styles.css`:** 庞大的全局样式表（约4300行）。极其细致地实现了 iOS 的设计语言（圆角、毛玻璃模糊效果 `backdrop-filter`、弹性动画、滑动切换）。包含了大量的 CSS 变量以支持多主题切换（默认、薄荷绿 mint、暮夜黑 midnight、粉樱 sakura）以及丰富的气泡样式配置。
*   **`script.js`:** 整个项目的主力逻辑枢纽（近4800行）。负责数据库管理、UI 状态控制、DOM 交互、LLM 网络请求控制、Canvas 图像处理以及摇一摇功能。

### 3.2 子应用模块 (`app/` 目录)
基于 `window.AppRegistry` 挂载的模块：
*   **`uchat.js`:** 核心通讯录/Agent列表页以及聊天界面的 HTML 结构。
*   **`settings.js`:** 仿 iOS 全局设置页面结构（包含飞行模式、Wi-Fi、蓝牙等UI壳子及部分全局设定）。
*   **`theme.js`:** 全局主题、壁纸及应用图标自定义页面的结构。
*   **`chatSettings.js`:** Uchat 专用的设置页面结构（API 配置、模型选择、聊天背景、气泡样式自定义、Agent 提示词修改等）。
*   **其他演示级应用:** `photos.js` (相册), `music.js` (音乐), `safari.js` (浏览器), `weather.js` (天气), `notes.js` (备忘录), `clock.js` (时钟，包含随系统时间动态更新的逻辑)。

## 4. 核心功能与技术实现细节

### 4.1 数据持久化系统 (Database & Storage)
*   **Dexie.js 数据库 (`ChatDB`):**
    *   `Settings`: 存储全局设置（主题、API Key、选定模型等）。
    *   `Agents`: 存储智能体数据（名称、头像、提示词、个性设定、气泡颜色等）。
    *   `Chats`: 存储会话列表元数据。
    *   `ChatMessages`: 存储具体的聊天记录（文本、角色、时间戳）。
*   **高可用降级方案 (`LocalStore` 类):** 
    *   为防止 `Dexie.js` 加载失败或 IndexedDB 不可用，在 `script.js` 中手动实现了一个完备的 Fallback 机制 `LocalStore`。它利用 `localStorage` 模拟了 Dexie 的部分增删改查异步 API，确保应用在极端情况下依然能读写核心数据。

### 4.2 Uchat 核心聊天功能
*   **流式网络请求 (Streaming API):** 
    *   利用 Fetch API 和 `ReadableStream` 配合 `TextDecoder`，原生实现了对 LLM 服务端发送事件（Server-Sent Events）的实时解析，实现打字机效果。
    *   特别适配了 DeepSeek 模型（支持处理思维链 `reasoning_content` 的解析与展示）以及标准的 OpenAI API 格式。
*   **上下文管理与 Markdown 渲染:**
    *   构建消息数组提交给 API。
    *   在前端实现了轻量级的自定义 Markdown 解析器（处理代码块、粗体、斜体、列表等），支持高亮显示代码。
*   **多态消息交互 (长按菜单 Context Menu):**
    *   长按聊天气泡可呼出 iOS 风格的上下文菜单，实现：复制(Copy)、编辑(Edit)、回复/引用(Quote)、转发(Forward)、删除(Delete)。
*   **多选模式 (Multiselect):**
    *   支持进入多选状态，批量选中消息后进行合并转发或批量删除。
*   **聊天UI高度自定义:**
    *   **气泡样式:** 支持五种预设风格：经典(Classic)、渐变(Gradient)、毛玻璃(Glass)、极简(Minimal)、糖果(Candy)，通过给根元素附加 `data-bubble-style` 属性配合 CSS 控制。
    *   **气泡颜色与背景:** 用户可上传图片作为聊天背景（通过 `FileReader` 转为 Base64 或 Blob URL 存储），并支持使用原生 `<input type="color">` 或预设色盘完全自定义 AI 和 User 的气泡颜色。

### 4.3 智能体 (Agent) 管理系统
*   **通讯录式列表:** 支持搜索、左滑操作（Pin 置顶、标为未读、删除）。
*   **自定义 Agent:** 用户可以手动新建 Agent，上传头像（内置 Canvas 图像压缩算法，确保 Base64 不超标），设定模型指令 (System Prompt)。
*   **摇一摇盲盒抽卡 (Shake-to-Create):**
    *   调用 HTML5 的 `DeviceMotionEvent` 监听手机物理摇晃。
    *   结合预设的随机设定组合（性别、种族、性格），通过向 LLM 发送特定 Prompt 生成一个带有完整背景故事的 JSON 格式新 Agent。
    *   生成后以精美的抽卡动画弹窗展示给用户，并自动保存到本地数据库。

### 4.4 iOS 仿生UI与交互体系
*   **导航与动画:** 实现了底部的 Home Indicator 控制，以及应用打开/关闭时丝滑的向上/向下平移与透明度渐变动画 (`transform: translateY`)。
*   **弹窗体系:** 抛弃原生 `alert/confirm`，纯手写了高仿真的 iOS Toast 提示、带输入框的 Dialog (自定义 prompt)、以及底部弹出的 ActionSheet (自定义 confirm)。
*   **原生级截图功能:** 没有依赖 `html2canvas` 等外部庞大库，纯手工编写了基于 `Canvas API` 的截图引擎。遍历 DOM 节点、计算文本换行 (`measureText`)、绘制圆角矩形和头像，直接在前端将指定聊天记录绘制成高清图片并触发下载。支持长截图功能。

## 5. 项目亮点总结
1.  **极高的完成度与独立性:** 不依赖 React/Vue 及构建工具（Webpack/Vite），仅靠单文件注入和纯原生 JS 构建了复杂的单页应用（SPA）。
2.  **极致的 UI/UX 复刻:** CSS 写法极其考究，不仅实现了 iOS 的毛玻璃和物理弹性动画，还兼顾了暗黑模式和全局多套配色主题。
3.  **鲁棒的数据设计:** `IndexedDB` 搭配 `localStorage` 降级，兼顾性能与安全性。
4.  **深度的 Canvas 运用:** 头像压缩与纯手工 DOM 转 Canvas 截图，展现了深厚的底层图形渲染功底。

---
*文档生成于 2026年5月*