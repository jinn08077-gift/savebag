# Saved baggg

一个本地收藏整理工具，用来保存链接、文字、标签、备注和阅读状态。

## 运行

```bash
python3 server.py
```

然后打开：

```text
http://localhost:8000/
```

同一 Wi-Fi 下的手机可以打开服务启动时打印的 `http://局域网IP:8000/` 地址。

## 数据保存

收藏数据保存在本机 SQLite 数据库：

```text
.savedbag_data/savedbag.sqlite3
```

这个目录不会提交到 GitHub。旧版浏览器 `localStorage` 数据会在打开页面时自动迁移到后端数据库。

## 功能

- 添加链接或文字收藏
- 自动识别来源和板块
- 修改标题、来源和板块解析
- 自定义收藏板块
- 新增、删除标签
- 按标题、标签、来源检索
- 管理收藏状态
