import { NextResponse } from "next/server";
import {
  fetchProjectTimeReport,
  fetchCommitActivityByDay,
  type GitLabCredentials,
  type TimeRangeFilter
} from "../../lib/gitlab";

export const dynamic = "force-dynamic";

interface TrackerRequestPayload extends GitLabCredentials, TimeRangeFilter {
  projectPath: string;
  commitMonth?: string;
}

export async function POST(request: Request) {
  let payload: TrackerRequestPayload;

  try {
    payload = (await request.json()) as TrackerRequestPayload;
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  if (!payload?.projectPath) {
    return NextResponse.json(
      { error: "Field 'projectPath' is required." },
      { status: 400 }
    );
  }

  if (!payload?.token) {
    return NextResponse.json(
      { error: "Field 'token' is required." },
      { status: 400 }
    );
  }

  try {
    const range: TimeRangeFilter = {
      from: payload.from,
      to: payload.to
    };
    const credentials: GitLabCredentials = {
      apiUrl: payload.apiUrl,
      token: payload.token
    };

    const report = await fetchProjectTimeReport(
      payload.projectPath,
      credentials,
      range
    );

    if (payload.commitMonth) {
      try {
        const commitData = await fetchCommitActivityByDay(
          payload.projectPath,
          credentials,
          payload.commitMonth
        );
        report.commitActivity = commitData.days;
        report.commitRange = commitData.range;
      } catch (commitError) {
        const warning =
          commitError instanceof Error
            ? commitError.message
            : "Unable to load commit activity.";
        if (report.warnings) {
          report.warnings.push(warning);
        } else {
          report.warnings = [warning];
        }
        console.warn("[gitlab-time-tracker] commit activity", warning);
      }
    }

    return NextResponse.json(report);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error encountered.";
    console.error("[gitlab-time-tracker]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
