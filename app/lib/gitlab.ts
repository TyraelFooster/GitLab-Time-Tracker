const DEFAULT_GRAPHQL_ENDPOINT = "https://gitlab.com/api/graphql";
const DEFAULT_ISSUE_PAGE_SIZE = 20;
const DEFAULT_TIMELOG_PAGE_SIZE = 100;
const DEFAULT_REST_ENDPOINT = "https://gitlab.com/api/v4";

export interface GitLabCredentials {
  apiUrl?: string;
  token: string;
}

export interface TimeRangeFilter {
  from?: string;
  to?: string;
}

export interface WeeklyUserTotal {
  userId: string;
  userName: string;
  username: string;
  seconds: number;
}

export interface WeeklyUserSummary {
  weekStart: string;
  label: string;
  totals: WeeklyUserTotal[];
  totalSeconds: number;
}

export interface LabelUserSummary {
  label: string;
  totals: WeeklyUserTotal[];
  totalSeconds: number;
}

export interface WeeklyLabelSummary {
  weekStart: string;
  label: string;
  totals: { label: string; seconds: number }[];
}

export interface WeeklyEpicSummary {
  weekStart: string;
  label: string;
  totals: { epic: string; seconds: number }[];
}

export interface CommitActivityDay {
  date: string;
  count: number;
  commits?: CommitInfo[]; // Add optional commits array
}

export interface CommitInfo {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  committed_date: string;
  web_url: string;
}

export interface CommitRange {
  month: string;
  from: string;
  to: string;
}

export interface GitLabIssueTimelog {
  id: string;
  spentAt: string;
  seconds: number;
  user: {
    id: string;
    name: string;
    username: string;
  };
  summary?: string | null;
}

export interface GitLabIssueTime {
  id: string;
  iid: string;
  title: string;
  webUrl: string;
  state: string;
  labels: string[];
  timeEstimate: number | null;
  epic?: {
    id: string;
    iid?: string | null;
    title: string;
    webUrl?: string | null;
  } | null;
  timelogs: GitLabIssueTimelog[];
}

export interface ProjectTimeReport {
  project: {
    id: string;
    name: string;
    webUrl: string;
  };
  issues: GitLabIssueTime[];
  summary: TimeSummary;
  range: TimeRangeFilter;
  generatedAt: string;
  commitActivity?: CommitActivityDay[];
  commitRange?: CommitRange | null;
  warnings?: string[];
}

export interface TimeSummaryGroup {
  label: string;
  seconds: number;
  hints?: Record<string, string | undefined>;
}

export interface TimeSummary {
  totalSeconds: number;
  byUser: TimeSummaryGroup[];
  byIssue: TimeSummaryGroup[];
  byEpic: TimeSummaryGroup[];
  byLabel: TimeSummaryGroup[];
  byState: TimeSummaryGroup[];
  byDate: { date: string; seconds: number }[];
  weeklyByUser: WeeklyUserSummary[];
  labelByUser: LabelUserSummary[];
  weeklyLabelBreakdown: WeeklyLabelSummary[];
  weeklyEpicBreakdown: WeeklyEpicSummary[];
}

interface GraphQLIssueNode {
  id: string;
  iid: string;
  title: string;
  webUrl: string;
  state: string;
  timeEstimate: number | null;
  labels: { nodes: Array<{ title: string }> };
  epic?: {
    id: string;
    iid: string | null;
    title: string;
    webUrl: string | null;
  } | null;
  timelogs: {
    nodes: Array<{
      id: string;
      spentAt: string;
      timeSpent: number;
      summary: string | null;
      user?: {
        id: string;
        name: string;
        username: string;
      } | null;
    }>;
  };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface IssuePagePayload {
  project: {
    id: string;
    name: string;
    webUrl: string;
    issues: {
      nodes: GraphQLIssueNode[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  } | null;
}

const ISSUE_TIMELOGS_QUERY = `
  query ProjectIssueTimelogs(
    $fullPath: ID!,
    $issuesFirst: Int!,
    $issuesAfter: String,
    $timelogFirst: Int!
  ) {
    project(fullPath: $fullPath) {
      id
      name
      webUrl
      issues(first: $issuesFirst, after: $issuesAfter, sort: UPDATED_DESC) {
        nodes {
          id
          iid
          title
          webUrl
          state
          timeEstimate
          labels(first: 10) {
            nodes {
              title
            }
          }
          epic {
            id
            iid
            title
            webUrl
          }
          timelogs(first: $timelogFirst) {
            nodes {
              id
              spentAt
              timeSpent
              summary
              user {
                id
                name
                username
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export async function fetchProjectTimeReport(
  projectFullPath: string,
  credentials: GitLabCredentials,
  range: TimeRangeFilter,
  issuePageSize: number = DEFAULT_ISSUE_PAGE_SIZE,
  timelogPageSize: number = DEFAULT_TIMELOG_PAGE_SIZE
): Promise<ProjectTimeReport> {
  const apiUrl = credentials.apiUrl?.trim() || DEFAULT_GRAPHQL_ENDPOINT;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${credentials.token}`,
  };

  if (!projectFullPath) {
    throw new Error("Missing GitLab project full path.");
  }

  if (!credentials.token) {
    throw new Error("Missing GitLab access token.");
  }

  const issues: GitLabIssueTime[] = [];
  let pageInfo: { hasNextPage: boolean; endCursor: string | null } | null =
    null;
  let projectMeta: { id: string; name: string; webUrl: string } | null = null;

  do {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: ISSUE_TIMELOGS_QUERY,
        variables: {
          fullPath: projectFullPath,
          issuesFirst: issuePageSize,
          issuesAfter: pageInfo?.endCursor ?? null,
          timelogFirst: timelogPageSize,
        },
      }),
    });

    if (!response.ok) {
      const message = `GitLab GraphQL responded with ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    const payload =
      (await response.json()) as GraphQLResponse<IssuePagePayload>;

    if (payload.errors?.length) {
      throw new Error(payload.errors.map((err) => err.message).join("; "));
    }

    if (!payload.data?.project) {
      throw new Error("Project not found or access denied.");
    }

    projectMeta = {
      id: payload.data.project.id,
      name: payload.data.project.name,
      webUrl: payload.data.project.webUrl,
    };

    const currentIssues = payload.data.project.issues.nodes.map((node) =>
      transformIssueNode(node, range)
    );
    issues.push(...currentIssues);

    pageInfo = payload.data.project.issues.pageInfo;
  } while (pageInfo?.hasNextPage);

  const summary = buildTimeSummary(issues);

  return {
    project: projectMeta ?? {
      id: "unknown",
      name: projectFullPath,
      webUrl: "",
    },
    issues,
    summary,
    range,
    generatedAt: new Date().toISOString(),
    commitActivity: [],
    commitRange: null,
    warnings: [],
  };
}

function transformIssueNode(
  node: GraphQLIssueNode,
  range: TimeRangeFilter
): GitLabIssueTime {
  const timelogs = (node.timelogs?.nodes ?? [])
    .filter((log): log is NonNullable<typeof log> => {
      if (!log || log.timeSpent <= 0) {
        return false;
      }
      return isWithinRange(log.spentAt, range);
    })
    .map((log) => ({
      id: log.id,
      spentAt: log.spentAt,
      seconds: log.timeSpent,
      summary: log.summary,
      user: {
        id: log.user?.id ?? "unknown",
        name: log.user?.name ?? "Unknown",
        username: log.user?.username ?? "unknown",
      },
    }));

  return {
    id: node.id,
    iid: node.iid,
    title: node.title,
    webUrl: node.webUrl,
    state: node.state,
    labels: node.labels?.nodes?.map((label) => label.title) ?? [],
    timeEstimate: node.timeEstimate ?? null,
    epic: node.epic
      ? {
          id: node.epic.id,
          iid: node.epic.iid,
          title: node.epic.title,
          webUrl: node.epic.webUrl,
        }
      : null,
    timelogs,
  };
}

function isWithinRange(spentAt: string, range: TimeRangeFilter): boolean {
  if (!range.from && !range.to) {
    return true;
  }

  const timestamp = Date.parse(spentAt);
  if (Number.isNaN(timestamp)) {
    return true;
  }

  if (range.from) {
    const fromTs = Date.parse(range.from);
    if (!Number.isNaN(fromTs) && timestamp < fromTs) {
      return false;
    }
  }

  if (range.to) {
    const toTs = Date.parse(range.to);
    if (!Number.isNaN(toTs) && timestamp >= toTs) {
      return false;
    }
  }

  return true;
}

/**
 * Builds a comprehensive time summary from issues and their timelogs.
 *
 * Contributors are automatically discovered from timelogs - no hardcoded user lists needed!
 * The function analyzes all timelogs across all issues and dynamically builds:
 * - byUser: All unique users who logged time (contributors)
 * - byIssue: Time spent per issue
 * - byEpic: Time spent per epic
 * - byLabel: Time spent per label
 * - byState: Time spent per issue state
 * - byDate: Daily time breakdown
 * - weeklyByUser: Weekly breakdown by user
 * - labelByUser: Label breakdown by user
 * - weeklyLabelBreakdown: Weekly label breakdown
 */
function buildTimeSummary(issues: GitLabIssueTime[]): TimeSummary {
  let totalSeconds = 0;
  const byUser = new Map<string, TimeSummaryGroup>();
  const byIssue = new Map<string, TimeSummaryGroup>();
  const byEpic = new Map<string, TimeSummaryGroup>();
  const byDate = new Map<string, number>();
  const byLabel = new Map<string, TimeSummaryGroup>();
  const byState = new Map<string, TimeSummaryGroup>();
  const weeklyBuckets = new Map<
    string,
    {
      weekStart: string;
      label: string;
      totals: Map<string, WeeklyUserTotal>;
      totalSeconds: number;
    }
  >();
  const labelBuckets = new Map<
    string,
    {
      totalSeconds: number;
      totals: Map<string, WeeklyUserTotal>;
    }
  >();
  const weeklyLabelBuckets = new Map<
    string,
    {
      weekStart: string;
      label: string;
      totals: Map<string, number>;
    }
  >();
  const weeklyEpicBuckets = new Map<
    string,
    {
      weekStart: string;
      label: string;
      totals: Map<string, number>;
    }
  >();
  const UNLABELED_KEY = "Unlabeled";

  for (const issue of issues) {
    const issueLabels = issue.labels.length ? issue.labels : [UNLABELED_KEY];
    let issueSeconds = 0;
    for (const timelog of issue.timelogs) {
      totalSeconds += timelog.seconds;
      issueSeconds += timelog.seconds;

      const dateKey = timelog.spentAt
        ? timelog.spentAt.slice(0, 10)
        : "unknown";
      byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + timelog.seconds);

      const userKey = timelog.user.username || timelog.user.id;
      const userGroup = byUser.get(userKey) ?? {
        label: timelog.user.name,
        seconds: 0,
        hints: {
          username: timelog.user.username,
        },
      };
      userGroup.seconds += timelog.seconds;
      byUser.set(userKey, userGroup);

      const weekBucket = getWeekBucket(timelog.spentAt);
      if (weekBucket) {
        const aggregate = weeklyBuckets.get(weekBucket.key) ?? {
          weekStart: weekBucket.start,
          label: weekBucket.label,
          totals: new Map<string, WeeklyUserTotal>(),
          totalSeconds: 0,
        };
        const userTotals = aggregate.totals.get(userKey) ?? {
          userId: timelog.user.id,
          userName: timelog.user.name,
          username: timelog.user.username,
          seconds: 0,
        };
        userTotals.seconds += timelog.seconds;
        aggregate.totals.set(userKey, userTotals);
        aggregate.totalSeconds += timelog.seconds;
        weeklyBuckets.set(weekBucket.key, aggregate);
      }

      for (const label of issueLabels) {
        const labelBucket = labelBuckets.get(label) ?? {
          totalSeconds: 0,
          totals: new Map<string, WeeklyUserTotal>(),
        };
        labelBucket.totalSeconds += timelog.seconds;
        const labelUser = labelBucket.totals.get(userKey) ?? {
          userId: timelog.user.id,
          userName: timelog.user.name,
          username: timelog.user.username,
          seconds: 0,
        };
        labelUser.seconds += timelog.seconds;
        labelBucket.totals.set(userKey, labelUser);
        labelBuckets.set(label, labelBucket);

        if (weekBucket) {
          const weeklyLabelBucket = weeklyLabelBuckets.get(weekBucket.key) ?? {
            weekStart: weekBucket.start,
            label: weekBucket.label,
            totals: new Map<string, number>(),
          };
          const current = weeklyLabelBucket.totals.get(label) ?? 0;
          weeklyLabelBucket.totals.set(label, current + timelog.seconds);
          weeklyLabelBuckets.set(weekBucket.key, weeklyLabelBucket);
        }
      }

      // Process epic breakdown for weekly buckets
      if (weekBucket) {
        const epicKey = issue.epic?.id ?? "unassigned";
        const epicLabel = issue.epic ? issue.epic.title : "No epic";
        const weeklyEpicBucket = weeklyEpicBuckets.get(weekBucket.key) ?? {
          weekStart: weekBucket.start,
          label: weekBucket.label,
          totals: new Map<string, number>(),
        };
        const current = weeklyEpicBucket.totals.get(epicLabel) ?? 0;
        weeklyEpicBucket.totals.set(epicLabel, current + timelog.seconds);
        weeklyEpicBuckets.set(weekBucket.key, weeklyEpicBucket);
      }
    }

    const issueGroup = byIssue.get(issue.id) ?? {
      label: `#${issue.iid} ${issue.title}`,
      seconds: 0,
      hints: {
        issueUrl: issue.webUrl,
        state: issue.state,
      },
    };
    issueGroup.seconds += issueSeconds;
    byIssue.set(issue.id, issueGroup);

    const epicKey = issue.epic?.id ?? "unassigned";
    const epicLabel = issue.epic ? issue.epic.title : "No epic";
    const epicGroup = byEpic.get(epicKey) ?? {
      label: epicLabel,
      seconds: 0,
      hints: {
        epicUrl: issue.epic?.webUrl ?? undefined,
      },
    };
    epicGroup.seconds += issueSeconds;
    byEpic.set(epicKey, epicGroup);

    const stateKey = issue.state || "unknown";
    const stateGroup = byState.get(stateKey) ?? {
      label: stateKey,
      seconds: 0,
    };
    stateGroup.seconds += issueSeconds;
    byState.set(stateKey, stateGroup);

    for (const label of issueLabels) {
      const labelGroup = byLabel.get(label) ?? {
        label,
        seconds: 0,
      };
      labelGroup.seconds += issueSeconds;
      byLabel.set(label, labelGroup);
    }
  }

  return {
    totalSeconds,
    byUser: Array.from(byUser.values()).sort((a, b) => b.seconds - a.seconds),
    byIssue: Array.from(byIssue.values()).sort((a, b) => b.seconds - a.seconds),
    byEpic: Array.from(byEpic.values()).sort((a, b) => b.seconds - a.seconds),
    byLabel: Array.from(byLabel.values()).sort((a, b) => b.seconds - a.seconds),
    byState: Array.from(byState.values()).sort((a, b) => b.seconds - a.seconds),
    byDate: Array.from(byDate.entries())
      .map(([date, seconds]) => ({ date, seconds }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    weeklyByUser: Array.from(weeklyBuckets.values())
      .map((bucket) => ({
        weekStart: bucket.weekStart,
        label: bucket.label,
        totals: Array.from(bucket.totals.values()).sort(
          (a, b) => b.seconds - a.seconds
        ),
        totalSeconds: bucket.totalSeconds,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    labelByUser: Array.from(labelBuckets.entries())
      .map(([label, bucket]) => ({
        label,
        totalSeconds: bucket.totalSeconds,
        totals: Array.from(bucket.totals.values()).sort(
          (a, b) => b.seconds - a.seconds
        ),
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds),
    weeklyLabelBreakdown: Array.from(weeklyLabelBuckets.values())
      .map((bucket) => ({
        weekStart: bucket.weekStart,
        label: bucket.label,
        totals: Array.from(bucket.totals.entries())
          .map(([label, seconds]) => ({ label, seconds }))
          .sort((a, b) => b.seconds - a.seconds),
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    weeklyEpicBreakdown: Array.from(weeklyEpicBuckets.values())
      .map((bucket) => ({
        weekStart: bucket.weekStart,
        label: bucket.label,
        totals: Array.from(bucket.totals.entries())
          .map(([epic, seconds]) => ({ epic, seconds }))
          .sort((a, b) => b.seconds - a.seconds),
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
  };
}

export function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0 && minutes === 0) {
    return "<1m";
  }
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

function getWeekBucket(
  spentAt: string
): { key: string; start: string; label: string } | null {
  const timestamp = Date.parse(spentAt);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  const weekStartDate = startOfWeek(new Date(timestamp));
  const start = isoDateOnly(weekStartDate);
  return {
    key: start,
    start,
    label: formatWeekLabel(weekStartDate),
  };
}

function startOfWeek(date: Date): Date {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = start.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setUTCDate(start.getUTCDate() + diff);
  return start;
}

function isoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatWeekLabel(date: Date): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });
  return `Week of ${formatter.format(date)}`;
}

interface RestCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  committed_date: string;
  web_url: string;
}

function resolveRestEndpoint(graphqlUrl?: string) {
  if (!graphqlUrl) {
    return DEFAULT_REST_ENDPOINT;
  }
  if (graphqlUrl.endsWith("/api/graphql")) {
    return graphqlUrl.replace("/api/graphql", "/api/v4");
  }
  return DEFAULT_REST_ENDPOINT;
}

export async function fetchCommitActivityByDay(
  projectFullPath: string,
  credentials: GitLabCredentials,
  month: string
): Promise<{ days: CommitActivityDay[]; range: CommitRange }> {
  if (!projectFullPath) {
    throw new Error("Missing GitLab project full path.");
  }
  if (!credentials.token) {
    throw new Error("Missing GitLab access token.");
  }
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("Field 'commitMonth' must use YYYY-MM format.");
  }

  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    throw new Error("Field 'commitMonth' must reference a valid month.");
  }
  const startDate = new Date(Date.UTC(year, monthIndex, 1));
  const endDate = new Date(Date.UTC(year, monthIndex + 1, 1));

  const since = startDate.toISOString();
  const until = endDate.toISOString();

  const restBase = resolveRestEndpoint(credentials.apiUrl);
  const encodedProject = encodeURIComponent(projectFullPath);
  const perPage = 100;
  let page = 1;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${credentials.token}`,
  };

  const counts = new Map<string, number>();
  const commitsByDay = new Map<string, CommitInfo[]>();

  while (true) {
    const url = `${restBase}/projects/${encodedProject}/repository/commits?since=${encodeURIComponent(
      since
    )}&until=${encodeURIComponent(
      until
    )}&per_page=${perPage}&page=${page}&with_stats=false`;
    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch commit activity (${response.status} ${response.statusText}).`
      );
    }

    const payload = (await response.json()) as RestCommit[];
    for (const commit of payload) {
      if (!commit?.committed_date) {
        continue;
      }
      const dayKey = commit.committed_date.slice(0, 10);
      counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1);

      // Store commit details by day
      const existingCommits = commitsByDay.get(dayKey) ?? [];
      existingCommits.push({
        id: commit.id,
        short_id: commit.short_id,
        title: commit.title,
        message: commit.message,
        author_name: commit.author_name,
        committed_date: commit.committed_date,
        web_url: commit.web_url,
      });
      commitsByDay.set(dayKey, existingCommits);
    }

    const nextPage = response.headers.get("x-next-page");
    if (!nextPage) {
      break;
    }
    const parsed = Number(nextPage);
    if (!Number.isFinite(parsed) || parsed <= page) {
      break;
    }
    page = parsed;
  }

  const days: CommitActivityDay[] = [];
  for (
    let cursor = new Date(startDate);
    cursor < endDate;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const key = isoDateOnly(cursor);
    days.push({
      date: key,
      count: counts.get(key) ?? 0,
      commits: commitsByDay.get(key) ?? [],
    });
  }

  return {
    days,
    range: {
      month,
      from: since,
      to: until,
    },
  };
}
