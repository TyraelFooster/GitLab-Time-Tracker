export const GITLAB_CONFIG = {
  API_URL: "https://gitlab.com/api/graphql",
  GROUP_PATH: "dhbw-se/se-tinf24b2/gruppe-4",
  TOKEN: "glpat-c6-ceWrK2uL60VLKxyE-CW86MQp1OmlsMGltCw.01.120sej9l3",
  ISSUE_BASE_URL: "https://gitlab.com/dhbw-se/se-tinf24b2/gruppe-4/dhubbw/-/issues"
} as const;

export const PROJECT_PATH = GITLAB_CONFIG.ISSUE_BASE_URL.replace(
  "https://gitlab.com/",
  ""
).replace("/-/issues", "");

export const TEAM_MEMBERS = [
  "TyraelFooster",
  "FireSlimex",
  "LinusK4566",
  "ni.di.whm"
] as const;

export const CATEGORIES = {
  DEPLOYMENT: "Deployment",
  DESIGN: "Design",
  IMPLEMENTATION: "Implementation",
  MAINTENANCE_WARTUNG: "Maintenance / Wartung",
  PROJEKT_MANAGEMENT: "Projekt Management",
  REQUIREMENTS_ENGINEERING: "Requirements Engineering",
  RESEARCH: "Research",
  ROOT: "Root",
  SOFTWARE_ARCHITEKTUR: "Software Architektur",
  SOFTWARE_TEST: "Software Test",
  STATUS_REPORT: "Status Report"
} as const;

export const CATEGORY_MAP = {
  [CATEGORIES.DEPLOYMENT]: 0,
  [CATEGORIES.DESIGN]: 0,
  [CATEGORIES.IMPLEMENTATION]: 0,
  [CATEGORIES.MAINTENANCE_WARTUNG]: 0,
  [CATEGORIES.PROJEKT_MANAGEMENT]: 0,
  [CATEGORIES.REQUIREMENTS_ENGINEERING]: 0,
  [CATEGORIES.RESEARCH]: 0,
  [CATEGORIES.ROOT]: 0,
  [CATEGORIES.SOFTWARE_ARCHITEKTUR]: 0,
  [CATEGORIES.SOFTWARE_TEST]: 0,
  [CATEGORIES.STATUS_REPORT]: 0
} as const;

export const CATEGORY_LIST = Object.values(CATEGORIES);

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
    "#D4A5A5"
  ],
  HEATMAP: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  CATEGORY: {
    [CATEGORIES.DEPLOYMENT]: "#a4de6c",
    [CATEGORIES.DESIGN]: "#82ca9d",
    [CATEGORIES.IMPLEMENTATION]: "#ff8042",
    [CATEGORIES.MAINTENANCE_WARTUNG]: "#d0ed57",
    [CATEGORIES.PROJEKT_MANAGEMENT]: "#d88884",
    [CATEGORIES.REQUIREMENTS_ENGINEERING]: "#8884d8",
    [CATEGORIES.RESEARCH]: "#aa40c4",
    [CATEGORIES.ROOT]: "#cccccc",
    [CATEGORIES.SOFTWARE_ARCHITEKTUR]: "#ffc658",
    [CATEGORIES.SOFTWARE_TEST]: "#8dd1e1",
    [CATEGORIES.STATUS_REPORT]: "#e1a8f0"
  }
} as const;

export const CHART_CONFIG = {
  HEIGHTS: {
    SMALL: 200,
    MEDIUM: 300,
    LARGE: 400
  },
  ANGLES: {
    LABEL_ROTATION: -45
  },
  DECIMAL_PLACES: 2
} as const;

export const TIME_CONFIG = {
  SECONDS_PER_HOUR: 3600,
  SECONDS_PER_MINUTE: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7
} as const;

export const DEVIATION_THRESHOLDS = {
  EXCELLENT: 10,
  GOOD: 30,
  POOR: 50
} as const;

export const DISPLAY_CONFIG = {
  MAX_TITLE_LENGTH: 50,
  MAX_CATEGORY_LENGTH: 30,
  TOP_COLLABORATIONS: 6,
  TOP_ISSUES: 5
} as const;

export const GERMAN_DAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag"
] as const;

export const GERMAN_DAY_SHORT = [
  "So",
  "Mo",
  "Di",
  "Mi",
  "Do",
  "Fr",
  "Sa"
] as const;

export const ERROR_MESSAGES = {
  FETCH_ISSUES: "Error fetching issues",
  FETCH_TIMELOGS: "Error fetching timelogs",
  LOADING_ERROR: "Fehler beim Laden der Daten",
  NO_DATA: "Keine Daten verfügbar",
  LOADING: "Daten werden geladen..."
} as const;

export const TOOLTIP_LABELS = {
  HOURS: "Stunden",
  TEAM_MEMBERS: "Teammitglieder",
  DEVIATION: "Abweichung",
  TOTAL_HOURS: "Gesamtstunden",
  HOURS_PER_WEEK: "Stunden pro Woche"
} as const;

export const CHART_LABELS = {
  ESTIMATED_TIME: "Geschätzte Zeit",
  ACTUAL_TIME: "Tatsächliche Zeit",
  AVERAGE_DEVIATION: "Durchschnittliche Abweichung",
  TEAM_SIZE: "Durchschnittliche Teamgröße",
  AVERAGE_TIME_PER_ISSUE: "Durchschnittliche Zeit pro Issue",
  WORK_TIME: "Arbeitszeit"
} as const;

export const SECTION_TITLES = {
  PROJECT_OVERVIEW: "Projektübersicht",
  TIME_DEVELOPMENT: "Zeitliche Entwicklung",
  TEAM_CATEGORIES: "Team & Kategorien",
  PRODUCTIVITY_ANALYSIS: "Produktivitätsanalyse",
  TEAM_COLLABORATION: "Team Zusammenarbeit",
  ISSUE_ANALYSIS: "Issue Analyse",
  ISSUE_TIME_ANALYSIS: "Issue Zeitanalyse",
  DETAILED_ACTIVITY: "Detaillierte Aktivität"
} as const;

export const KPI_LABELS = {
  WEEKLY_PERFORMANCE: "Durchschnittliche Wochenleistung",
  MAIN_FOCUS: "Hauptfokus",
  ISSUE_COMPLETION_TIME: "Durchschnittliche Issue-Abschlusszeit",
  MOST_ACTIVE_WEEK: "Aktivste Woche",
  ACTIVE_WEEKS: "aktive Wochen",
  HOURS_PER_WEEK: "h pro Woche",
  COMPLETED_ISSUES: "abgeschlossene Issues"
} as const;

export const CHART_TITLES = {
  WEEKLY_PERFORMANCE: "Wöchentliche Leistung",
  CUMULATIVE_PROGRESS: "Kumulativer Fortschritt",
  TEAM_ACTIVITY_COMPARISON: "Team Aktivitätsvergleich",
  HOURS_PER_WEEK_PER_PERSON: "Stunden pro Woche pro Person",
  CATEGORY_TREND: "Kategorie-Trend",
  CATEGORY_DISTRIBUTION: "Kategorie Verteilung",
  TEAM_ACTIVITY: "Team Aktivität",
  HOURLY_DISTRIBUTION: "Tageszeitliche Verteilung",
  WEEKLY_DISTRIBUTION: "Wöchentliche Verteilung",
  TOP_COLLABORATIONS: "Top Team Zusammenarbeit",
  AVERAGE_TEAM_SIZE: "Durchschnittliche Teamgröße pro Issue",
  ISSUE_COMPLEXITY: "Issue Komplexität",
  TIME_COMPARISON: "Zeitvergleich nach Kategorien",
  DAILY_ACTIVITY: "Tägliche Aktivität"
} as const;
