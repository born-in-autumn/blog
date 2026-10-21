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



链路的真实分层
阶段	做什么	crate	归属
AST lowering	impl Trait 拆成 alias + opaque item	rustc_ast_lowering	前端
HIR 类型 lowering	生成 Alias(Free) / Alias(Opaque)	rustc_hir_analysis	HIR analysis
collect	clauses_of、type_of、opaque 收集	rustc_hir_analysis/collect	HIR analysis
环境构造	param_env 组装 + 归一化	rustc_ty_utils + rustc_trait_selection	类型查询 / trait selection
类型表示	Ty、Clause、ParamEnv	rustc_middle::ty、rustc_type_ir	类型系统核心
推导	InferCtxt、unify、region var	rustc_infer	类型推导
归一化 / 选 impl	old selection + next solver	rustc_trait_selection、rustc_next_trait_solver	trait solving
region 层	OutlivesEnvironment、resolve_regions	rustc_trait_selection/regions	区域/借用（共享）



rustc不会现搭一个类型树。它把类型hash之后放进一张全局表，相同的类型只存一份，这叫interning，也就是每个类型节点出生时，会顺手算一份属性摘要，存进节点里

摘要就是TypeFlag
它是一个位掩码，记录“这个类型里含有什么”：
* 含 region 吗
* 含推断变量吗
* 含 rigid 别名吗
* 含 non-rigid 别名吗 ← 我们关心的这个



在 rustc 的 ty 层，有三类平级的节点：
Ty      —— 类型
Const   —— 常量
Region  —— 生命周期



所以你可以暂时这样记：

TypingMode ≈ 一张门禁卡，上面写着“我现在能看穿哪些 opaque”。