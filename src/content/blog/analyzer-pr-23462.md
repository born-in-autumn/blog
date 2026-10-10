---
title: "rust-analyzer PR#23462"
date: 2026-10-03
---

### 概要
这是是Rust社区给我合并的第一个[PR](https://github.com/rust-lang/rust-analyzer/pull/23462)，是我提交的第二个PR
背景是，`Self`本身是一个有点特殊的关键字，之前RA的代码好像从来没处理过这个Edge Cases，在之前，RA判断变体还是函数，主要看的是大小写

