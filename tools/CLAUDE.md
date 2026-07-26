# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About this repository

This is a personal vault / knowledge base directory for an embedded systems student.

## 关于我

- 学生，正在学嵌入式
- 关注领域：嵌入式MCU、Linux应用、Linux内核开发
- 偏好：用中文、不要过度格式化

## Vault 结构

- projects/：进行中的项目，每个项目一个文件夹，项目内文档放 `文档/` 子目录
- notes/：永久笔记
- archive/：已完成/不再活跃的内容

## 笔记模板

新建笔记时使用以下 frontmatter：

```yaml
---
title: 笔记标题
tags: []
created: YYYY-MM-DD
type: permanent
summary: 一句话摘要
---
```

## 行为规则

- 可以：添加标签、创建[[双向链接]]、生成摘要、整理和分类
- 不可以：删除已有笔记内容、修改我的原始记录
- 创建新笔记时必须遵循上面的 frontmatter 模板
- 每次整理后更新相关文件夹的 index.md

## 标签体系

- 按领域：#tech #business #reading #life
- 按状态：#todo #in-progress #done
- 按类型：#idea #reference #project

## 术语表

- 统一用「RAG」，不用「检索增强生成」
- 统一用「LLM」，不用「大模型」
- 统一用「vault」，不用「知识库」

## 操作规则

- notes/ 下的文件是我的原始笔记，未经确认不要修改内容
- 可以修改 frontmatter（补充缺失的 tags、summary 等）
- 新建笔记时必须包含完整 frontmatter
- 项目完成后移入 archive/
