---
title: "type system"
date: 2026-10-017
description: "new trait solver learning"
---


WF 看见 &'a T
  wf.rs 登记 TypeOutlives(被引用类型, 生命周期)
    求解器证明这个目标
      嵌套查询返回时：canonical/mod.rs
        ExternalRegionConstraints::NextGen
        → register_solver_region_constraint   抄回外层
      compute_type_outlives_goal（solve/mod.rs）
        destructure_type_outlives
        RegionConstraint::new_from_or          第一次封盒，Or 空则两格都空
        EvalCtxt::register_solver_region_constraint
          → InferCtxt::register_solver_region_constraint（obligations.rs）
            RegionConstraint::build_and(新盒, 旧盒)
            若合并后 Or 空，And 也换成空清单
            overwrite

笔记本 = InferCtxt
仓库   = InferCtxt.solver_region_constraint_storage
         类型 SolverRegionConstraintStorage(Option<盒子>)
盒子   = RegionConstraint，别名 SolverRegionConstraint
         ├── and_constraint: And          必须全成立的叶子
         └── or_constraint: Or(Box<[And]>) 几选一，每路一个 And
叶子   = LeafRegionConstraint
         RegionOutlives / PlaceholderTyOutlives
         / AliasTyOutlivesViaEnv / Ambiguity

regionck 结束
  wfcheck::enter_wf_checking_ctxt
    resolve_regions_with_outlives_env(span = tcx.def_span(body_def_id))
      process_registered_region_obligations
        destructure_solver_region_constraints
          get_constraint()                   打开仓库
          第 6 站 destructure_type_outlives_constraints_in_root
            末行 new_from_or                 第二次封盒，清理在这里
          is_false()                         看清理后的整盒
          第 7 站 for                        看叶子纸条


🔰 动线分三幕：A 生产、B 进 binder 记账、C 收尾清场。最关键的是一条虚线——「B 存、C 取」

```text
════════ 求解器侧（rustc_next_trait_solver）════════

【A 生产】要证一个 outlives 目标（T:'a / 'a:'b）
  compute_*_goal (solve/mod.rs)
     └→ destructure_type_outlives / _alias_outlives     拆成 Or 的叶子
          └→ register_solver_region_constraint          存进「当前 DNF 约束」槽

【B 进 binder】遇到 for<'a>
  enter_forall_with_assumptions (eval_ctxt/mod.rs:1371)
     ├→ create_next_universe                 水位 +1，新楼层 u
     ├→ 记账员 region_assumptions_for_placeholders_in_universe   算这层 assumptions
     └→ insert_placeholder_assumptions(u, …)          存起来 ─────┐
        （之后在 binder 里继续证目标，可能再嵌套 B，楼层越叠越高）    │
                                                                   │
【C 收尾清场】结算一个 goal 的响应                                   │
  evaluate_added_goals_and_make_canonical_response                  │
     └→ 司机 eagerly_handle_placeholders                             │
          └→ for u in largest → smallest+1（fold + rev）             │
               └→ 清场工 eagerly_handle_placeholders_in_universe ───┘
                                                              ↑ get_placeholder_assumptions(u)

════════ 数据模型侧（rustc_type_ir/region_constraint.rs）════════
清场工（651）三步：
  步1 rewrite_type_outlives_…（937）  类型→region
        ├ 占位类型那支（982）
        └ alias 那支（1025）
  步2 compute_new_region_constraints（692）  region 求传递闭包
  步3 pull_region_outlives_…（785）   ＝ pull 搬走
       └→ overwrite_solver_region_constraint 写回
            └→ false→NoSolution / ambig→AMBIGUOUS / 别的→Yes
```get / overwrite   槽的“读与写”（IO）
rewrite           变换：把这份 DNF 改个形态（type→region）
pull              变换：rewrite 的特例——把 placeholder 拽出它的 universe
compute           变换：region 求传递闭包

易混长名，认「中间那个词」就行：

```text
司机     eagerly_handle_placeholders                            求解器侧:114  收尾按层调度
清场工   eagerly_handle_placeholders_in_universe               数据侧:651    清一层（三步）
──────以下三个都叫 rewrite_*_outlives_constraints…，看 type 中间词──────
步1总网关  …type_outlives…                                     数据侧:937    逐叶分发
步1支A    …placeholder_ty_outlives…                            数据侧:982    占位类型→region
步1支B    …alias_ty_outlives…                                  数据侧:1025    alias→region
```