export const GITLAB_CONFIG = {
  API_URL: "https://gitlab.com/api/graphql",
  PROJECT_PATH: "dhbw-se/se-tinf24b2/gruppe-4/dhubbw",
  TOKEN: "glpat-c6-ceWrK2uL60VLKxyE-CW86MQp1OmlsMGltCw.01.120sej9l3",
} as const;

export const PROJECT_PATH = GITLAB_CONFIG.PROJECT_PATH;

export const COLORS = {
  PRIMARY: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"],
  TEAM: [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
  ],
  HEATMAP: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
} as const;
