---
title: "The type system learning of rust"
date: 2026-10-20
description: "类型学习"
---

## 编译器眼中的类型

一个类型，在编译器这里，就是一个枚举值（TyKind），每个变体是类型的一种形状
* Bool、Char、Int、Uint、Float：基本类型
* Adt(def, args)：结构体/枚举/union，Vec<u32> 就是 Adt(Vec, [u32])
* Ref(region, ty, mutability)：&'a T
* Tuple(tys)、Slice(ty)、Array(ty, len)
* Param(param_ty)：泛型参数，比如 A
* Alias(is_rigid, alias_ty)：别名/匿名类型
* Infer(infer_ty)：类型检查期间的“待定”变量

## Alias是什么



