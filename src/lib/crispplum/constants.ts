export type ReqEnv = { baseUrl: string; apiKey: string | null };

export const SERVICES_URL = [
  {
    name: "tree_potential",//树势分析
    service: "svcr196nbwod3f8uk2rohwnf",
    endpoint: "predict/treevigor",
  },
  {
    name: "phenological_period",//物候期  
    service: "vilgz96h5lf1whzba6xrivwb",
    endpoint: "predict",
  },
  {
    name: "flower_analysis",//花量分析
    service: "hervuui95femc4lpadvd78fn",
    endpoint: "flower_detection/v2",
  },
  {
    name: "leaf_plum_ratio",//叶果比
    service: "photvy868xzihibgzovqhnqb",
    endpoint: "leaf_plum_ratio",
  },
] as const;

/** 叶果比分析：仅幼果期、膨大期、采收期时请求 */
export const PHENOLOGICAL_PERIODS_FOR_LEAF_PLUM = ["幼果期", "硬核期", "膨大期", "采收期"];

/** 花量估计：仅初花期、盛花期、谢花期时请求 */
export const PHENOLOGICAL_PERIODS_FOR_FLOWER = ["初花期", "盛花期", "谢花期"];

/** 需要进行三维重建的物候期 */
export const VALID_PERIODS_FOR_RECONSTRUCTION = [
  "休眠期",
  "萌动期",
  "露白期",
  "初花期",
  "盛花期",
  "谢花期",
];
