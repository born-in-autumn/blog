---
title: "给 Clippy 加一条 Option 写法的 Lint"
date: 2026-10-03
description: "Rust 里 Option 有非常多的写法，这条 Lint 就是冲着这个来的。"
repo: clippy
pr: "17819"
---

### 概要
这是是我给Rust社区的第一个[PR](https://github.com/rust-lang/rust-clippy/pull/17819)，我相信这会是一个好的开始。
主要是给Clippy增加了一个Lint规则，
在Rust里Option有非常多的写法

### 分析
