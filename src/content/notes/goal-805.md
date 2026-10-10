---
title: "goals#805:reducing target directory size"
date: 2026-10-08
description: "有关进入这个goal的前置准备"
---

### 内容
目前我看到已经提pr了，希望这个goal能被accepted吧...

#### 目前的问题
rust编译出来的产物有点太大了，动不动就几十G，现在硬盘很贵

#### 主要内容以及名词解析

artifact三件套：.rmeta（元数据）/ .rlib（机器码+元数据）/ incremental/（query 缓存）；包含关系 section < rmeta < rlib，query cache 是另一条线、与 rmeta 大量重复。

测量：拿到一个文件的大小很简单，但是溯源却很难，我们得知道到底哪个query花的空间多，而且这里有一个点，query的增量系统和rmeta有很多重复，但是找到这些重复很难，因为重复不等于相同，并且写入的时候并没有单一的写入口，生命周期也是相反的

Encodable：一个rust trait，序列化用的，算是核心，改这个文件，能同时降低artifact三件套，但是不好改，之前改过一次效果不好而且非常复杂

DWARF：调试信息的标准格式，跟机器码一起存进二进制，让调试器知道变量、类型、行号。

dwz：一个工具，把重复的 DWARF 调试信息合并去重。

type sig：DWARF 里给每个类型算的哈希指纹，指纹相同就能判重共享。

RLE：行程编码，把长串相同字节记成"值 × 次数"，适合零多的文件。

mmap：把文件直接映射成内存按需读，不先解压整块；压缩会破坏它。

split-debuginfo：把调试信息从二进制拆成单独文件，方便单独压缩或丢弃
。
ripgrep：Rust 写的命令行搜索工具 rg，此处被当代表性 benchmark。

build script：crate 根目录的 build.rs，编译主 crate 前先跑，用来生成代码、编译 C 库。
GC：此处指"安全清理 target/ 里的废旧产物"，不是运行时垃圾回收。

### 测试进展
测试跑了一个库
发现猜想基本一致
现在nightly已经实现了去重，但是还没进stable
后续可能需要crater，看看真实世界还有没有哪些库因为这次breakchange直接不能用了
### 后续计划
rustc-perf需要接入github-ci
需要把size随时间变化的图也加进来
增加新的基准metric


