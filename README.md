# 文字生成小电影网站

一个纯前端小应用：输入中文文字描述，自动拆分为多个场景，在 Canvas 上生成动态字幕画面，并导出为 WebM 小电影。

## 功能

- 文字描述自动拆分场景并生成短片。
- Canvas 实时渲染 + WebM 导出下载。
- 支持 Google 登录按钮（基于 Google Identity Services）。
- 支持 X 登录入口（OAuth2 授权跳转，授权码回调后需后端换取 access token）。

## 使用方式

1. 打开页面后，可先在“登录配置”填写：
   - Google Client ID
   - X Client ID
   - X Redirect URI
2. 点击“使用 Google 登录”或“使用 X 登录”。
3. 输入一段电影描述（多句更有故事感）。
4. 点击“生成小电影”。
5. 在下方预览并下载视频。

## 本地运行

```bash
python3 -m http.server 4173
```

浏览器访问：`http://localhost:4173`
