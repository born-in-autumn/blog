---
title: "Borrow Check学习"
date: 2026-11-09
description: "关于Rust借用检查Polonius的学习"
---

## NLL
非词法生命周期，对应的是词法生命周期，早在之前就改版了
## Region
> Region可以记为一组由程序点组成的集合 , Values('a) = { P1, P3, P4 ....}
有一种特例叫universal region，它表示的声明周期来自函数签名，是调用者来选择的，而不是编译器推导出来的，也叫free region，意思是在函数体内是自由的，没有被函数体内的for<'a>绑定
三类 region 变量
类别	谁决定它的值	例子	代码里的名字
universal / free（∀）	调用者	签名里的 'a、'static、省略的生命周期	NllRegionVariableOrigin::FreeRegion
existential（∃）	编译器求解	函数体内局部借用的生命周期	NllRegionVariableOrigin::Existential
placeholder	for<'a> 的高阶绑定	for<'a> fn(&'a u32) 里的 'a	NllRegionVariableOrigin::Placeholder

### liveness(存活)
liveness是liveness分析搞出来的

如果某个变量的类型里含有 region R，而这个变量在程序点 P 之后还可能被用到，那么：


R live at P
大白话："后面还要用这个引用，所以 R 必须覆盖 P。"

比如 let x = &v[0]; 之后 println!("{x}") 会用到 x，那么 x 的类型里的 region 在 println 那个点必须活着。

liveness 由 MIR 类型检查里的 liveness 分析算出来。

### outlives（谁覆盖谁）
outlives是类型检查搞出来的
当一种类型被当成另一种类型使用时，会产生：
R1: R2
读作 "R1 至少要活得和 R2 一样久"，也就是：
Values(R1) ⊇ Values(R2)
大白话："R2 覆盖的点，R1 也必须覆盖。"
常见的来源是子类型

### 传播算法

SCC：强连通分量 strongly connected component，互相要求对方活得一样久的 region 打包成一个整体。



