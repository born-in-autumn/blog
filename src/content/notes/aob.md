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