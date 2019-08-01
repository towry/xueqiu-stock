# 雪球股票助手

Forked from `coolzilj/xueqiu-stock/`, fixed some issues.

## 说明

- 编辑 `config.json`, 修改 `uid` 为你的雪球用户 id
- `npm install` 安装依赖模块
- `npm start` 不经过打包，从命令行直接运行『雪球股票助手.app』
- `npm run build` 打包『雪球股票助手.app』

## 配置文件说明

运行app后，可通过“打开配置文件”按钮来打开配置文件 `config.json`.

- uid: 你的雪球uid
- portfolio: 如果为空，则获取所有sock的数据。如果只想获取某个自选组合里的数据，可以在这里填上自选组合的名字.

## Changes

- 2/22/2018, Fix the outdated modules; Fix the quit event.
- 8/1/2019, Fix the outdated modules; Fix the build.

## TODO

