---
title: "type system"
date: 2026-11-02
description: "chalk system learning"
---

抱歉，刚才那条被截断了。重新完整整理一遍，这次一次到位。

---

# 📘 chalk 学习笔记（截至 4.2）

## 第 1 章：What is chalk?

**核心思想**
- chalk 是一个 Rust **trait 求解器**。
- 它把 Rust 的 trait 系统问题**降级（lowering）成逻辑程序**，再用逻辑求解器求解。
- 类型 / trait / impl / 关联类型 → 翻译成**逻辑谓词 + 程序子句（program clauses）**。
- 类比：Rust 类型系统 ≈ Prolog 程序；「某类型是否实现某 trait」≈ 一个待证明的**查询 goal**。

---

## 第 3 章：Types and lifetimes（类型与生命周期）

### 3.1 Interners（内聚器）

**问题**：Rustc 想用「表 + 索引」表示类型（省内存），测试工具想用 `Box`（省事），怎么统一？
**答案**：用 **Interner 模式**把两者解耦。

```
Ty<I>          —— 「句柄」（轻量、可比较）
  │
  └─ 展开 → TyData<I> / TyKind  —— 「内容」（真正的数据结构）
         实际内存表示由 I::InternedTy 决定
```

**关键点**
- chalk **不关心**类型在内存里怎么存（索引 or Box），由嵌入方（rustc / 测试工具）自己定。
- 所以说 chalk 的代码是**「表示无关」**的：所有逻辑只依赖 `Interner` trait 提供的关联类型。

### 3.2 Rust types

**核心哲学（最重要）**
> `TyKind` 的分类**不是按 Rust 表面语法**，而是按**「求解器要如何对待它」**。

**`TyKind` 核心变体表**

| 变体 | 含义 | 记忆锚点 |
| --- | --- | --- |
| `Adt`（应用类型）| `Vec<u32>`、`Option<T>` 这样的结构 | `Vec<T>` |
| `Placeholder` | 泛型声明里的抽象参数 `T` | `fn foo<T>()` 里的 `T` |
| `InferenceVar` | 正在推断的未知量 | `let x = ...` 推导时 |
| `Dyn` | trait 对象 `dyn Trait` | `dyn Display` |
| `Function` | `fn` 指针 | `fn(u32)` |
| `Alias` | 类型别名 / 关联类型投影 | `<T as Trait>::Item` |
| `BoundVar` | 被 `for<'a>` 绑定的变量（De Bruijn 索引）| `for<'a> fn(&'a u8)` 的 `'a` |
| `Error` | 出错时的「毒」类型 | 传播错误 |

（含第 3.2 章里顺带引入的 **De Bruijn 索引**：bound var 用**嵌套深度**计数，depth 0 = 最内层，每往外一层 +1。）

**3.2.1 AliasTy（别名类型）**
- 别名可以是投影 `<T as Trait>::Item`。
- **归一化**：若 `T=Option<u32>` 且 impl 说 `Item=u32`，投影可归一化成 `u32`；否则**保持别名形式**。
- 合一别名时，会生成 `AliasEq` 目标（第 4.2 章展开）。
- 「标量 / Scalar」概念（如字符、布尔、字符串切片等简单类型）也在此提及。

### 3.3 Rust lifetimes（生命周期）

与类型**完全平行**的一套设计：

```
Lifetime<I>  :  LifetimeData<I>   （句柄 : 内容）
```

**`LifetimeData` 四变体**（与 `TyKind` 一一对应）：

| 变体 | 语义 |
| --- | --- |
| `BoundVar` | `for<'a> fn(&'a u8)` 里的 `'a` |
| `InferenceVar` | 正在推断的生命周期 |
| `Placeholder` | `fn foo<'a>()` 函数体里的 `'a` |
| `Static` | `'static` |

**记忆锚点**：chalk 对「类型」和「生命周期」**用同一套三件套**（句柄 + Data + Interner），变量族完全平行。

### 3.4 / 3.4.1 TypeFoldable & TypeFolder

**fold 是什么**
> 对类型做一次**「带替换的深拷贝」**，沿途可以对某些节点做小替换。

**两大用途**
1. **替换（substitution）**：把泛型参数换成具体值（最常见）。
2. **跨 interner 搬运**：把类型从一个内存表示转换到另一个。

**调用形式**
```rust
output_ty = input_ty.fold_with(&mut folder, 0);
//                              folder     binders 层数（一般从 0）
```

**三层职责链**

```
TypeFoldable::fold_with   —— 入口，递归遍历整棵树
        ↓ 遇到「可拦截」的节点
TypeFolder::fold_ty       —— 你的拦截点；默认实现
        ↓ 没拦截 → 交还默认
TypeSuperFoldable::super_fold_with —— 递归折叠内部内容
        ↓ 更精细粒度
fold_free_var_ty 等        —— 更细的拦截点
```

**自定义 fold 三步**
1. 定义自己的 `TypeFolder` 类型；
2. 实现相应方法，在需要的粒度「拦截」；
3. 不想替换处调用 `super_fold_with` 回到默认递归（类比 OOP 的 `super.xxx()`）。

**`binders` 参数**
- 表示折叠时**已穿越多少层绑定器**，用来换算 De Bruijn 索引。
- 例：`Foo<'a>: for<'b> Bar<'b>` 中，`Foo<'a>` 在 depth 0 被访问，`Bar<'b>` 在 depth 1（多穿了一层 `for<'b>`）。

**何时实现**
- `TypeFoldable`：任何「会被遍历的 IR 项」（类型、goal、`Vec`、元组、引用……）。
- `TypeSuperFoldable`：**只有**在 `TypeFolder` 上有回调的类型（类型、生命周期）才需要。

**derive 三条件之一**（告诉宏「哪个参数是 interner」）
1. 有 `I: Interner` 参数；
2. 有 `I: HasInterner` 参数；
3. 用 `has_interner(XXX)` 属性标注。

---

## 第 4 章：Lowering to logic（降级到逻辑）

### 4.0 章节引言
- 把 Rust 代码「降级成逻辑」的规则：什么代码能/不能降级、字段的类型、well-formedness 等。

### 4.1 Goals and clauses（目标与子句）

**目标（Goal）**：trait 系统要回答的「问题」。
**程序子句（Program clause）**：trait 系统「已知的事实/规则」。用 `Implies` 连接，即 **`前提 :- 结论`**（结论写在 `:-` 左边，Prolog 语序）。

**核心谓词**

| 谓词 | Rust 含义 |
| --- | --- |
| `Implemented(T: Trait)` | `T` 实现了 `Trait` |
| `Normalize(A -> B)` | `A` 能归一化成 `B`（关联类型化简）|
| `AliasEq(A = B)` | `A` 与 `B` 是同一别名/投影相等 |
| `FromEnv(T: Trait)` | 从环境中「白拿」的 `T: Trait` |

**量化与规则形式**
- 规则是全称量化的：`forall<T> { Implemented(T: Trait) :- ... }`
- `K = <type> | <lifetime>`：**不能量化 trait**。

**WellFormed**
- 类型要「良构」，即其使用的 trait 必须已 `Implemented`。
- 例如 `T::Item` 良构需要 `Implemented(T: Trait)`。

**FromEnv**
- `FromEnv` 谓词来源于「环境中已知成立的约束」（如 `fn foo<T: IntoIterator>()` 里 `T: IntoIterator` 就是这个函数体环境的一部分）。
- 有了 `FromEnv(T: Trait)`，函数体内就能「白拿」`Implemented(T: Trait)` 来证明别的目标。

### 4.2 Type equality and unification（类型相等与合一）

**要回答的问题**：关联类型投影什么时候「等于」另一个类型？

**四个关键零件**

**(1) 归一化（Normalization）**
- `Normalize` 谓词**只来自 impl**。
- 例：`impl<T> IntoIterator for Option<T> { type Item = T; }` 降级成

```prolog
forall<T> {
    Normalize(<Option<T> as IntoIterator>::Item -> T) :-
        Implemented(Option<T>: IntoIterator)
}
```

- 每个关联类型生成一组这样的规则（因为不能量化 trait）。

**(2) Placeholder（占位）关联类型**
- 当投影**无法归一化**时（如 `fn foo<T: IntoIterator>` 里 `T::Item` 不知道 `T` 是啥），引入占位类型：

```rust
(IntoIterator::Item)<T>
```

- 行为像普通类型（如 `Vec<T>`）：**只和它自己 + 相同参数相等**。
- 从不被用户直接书写，只内部使用；rustc 里叫 `TyKind::UnnormalizedProjectionTy`。
- 这种「能拖就拖」的策略叫 **lazy normalization（惰性归一化）**。

**(3) AliasEq——统一两种路径**
- 对每个关联项**恰好生成两条** `AliasEq` 子句：

```prolog
forall<T, U> {
    AliasEq(<T as IntoIterator>::Item = U) :-
        Normalize(<T as IntoIterator>::Item -> U)
}

forall<T> {
    AliasEq(<T as IntoIterator>::Item = (IntoIterator::Item)<T>)
}
```

- 第一条 = 积极路径（知道 impl → 算出结果）；
- 第二条 = 惰性路径（算不出 → 退回 placeholder）。
- 记忆：**`Normalize ⇒ AliasEq`（反之不然）**。

**(4) 与合一整合**
- 合一签名：`Unify(A, B) = Result<Subgoals, NoSolution>`。
- 合一投影 `P` 与某类型 `T` 时：**总是成功，但欠债**——生成子目标 `AliasEq(P = T)` 往回传。
- 合一只做结构相等，**不亲自算**关联类型；把语义交给 trait 求解器。
- 解耦关键：合一把难题「外包」出去。

---

## 全局记忆地图

```
第1章   chalk = 把 Rust trait 系统降级成逻辑程序
   │
第3章   怎么表示「类型/生命周期」？
   ├─ 3.1  Interner 模式：句柄 + 内容，表示无关
   ├─ 3.2  TyKind：按「求解器怎么对待」分类，不是按语法
   ├─ 3.3  Lifetime：与类型平行建模（四变体对应）
   └─ 3.4  fold：带替换的深拷贝（fold_with / TypeFolder / super_fold_with）
   │
第4章   怎么把 Rust 降成逻辑？
   ├─ 4.1  谓词：Implemented / Normalize / AliasEq / FromEnv
   ├─ 4.1  规则形式：forall<T> { ... :- ... }，不能量化 trait
   └─ 4.2  关联类型相等：Normalize（积极）+ placeholder（惰性）→ AliasEq → 合一欠债
```

---

需要的话，我可以再补一张「角色/术语速查表」（中英对照 + 一句话解释），或者直接继续 4.3《Implied bounds》。你说哪样？