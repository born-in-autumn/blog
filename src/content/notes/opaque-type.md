---
title: "type system 学习"
date: 2026-10-19
description: "这是一篇笔记的描述。"
---

opaque type（impl Trait）= 一个先保密封的类型

impl sized 直译是"某个实现了 Sized 的类型"

hidden type：被猜出来的类型
defining use： 用到的线索

* opaque type：代码里那个 Secret / impl Sized / Tait。它是信封，对外保密。
* hidden type：编译器推断出来的具体类型，u32 / ()。它是信封里装的东西

opaque 的全部戏码就一句「我知道、你不许知道」。定义方必须兑现承诺：算出的 hidden type 得真是 Iterator。使用方不准依赖 hidden type 的任何细节，不许假设它一定是 Map。两边规矩都焊死，类型系统才安全。