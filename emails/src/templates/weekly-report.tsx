import { Body, Head, Html, Preview } from "@react-email/components";
import * as React from "react";
import type { ReportData, DailyRow, SessionDailyRow } from "../types.js";
import { Header } from "../components/header.js";
import { KpiCards } from "../components/kpi-cards.js";
import { LineChart } from "../components/line-chart.js";
import { StatTable } from "../components/stat-table.js";
import { SectionDivider } from "../components/section-divider.js";
import { Footer } from "../components/footer.js";

interface WeeklyReportProps {
  data: ReportData;
}

const CATEGORIES = ["웹", "이메일", "문서", "에이전트", "일반"] as const;


const CAT_COLORS: Record<string, string> = {
  웹: "#3b82f6",
  이메일: "#8b5cf6",
  문서: "#f59e0b",
  에이전트: "#10b981",
  일반: "#64748b",
};

function shortDate(d: string) {
  return d.slice(5); // "2026-01-20" → "01-20"
}

function sumDailyCount(rows: DailyRow[]) {
  return rows.reduce((s, r) => s + r.count, 0);
}

function maxDailyUsers(rows: DailyRow[]) {
  return Math.max(...rows.map((r) => r.users));
}

function sumSessionMessages(rows: SessionDailyRow[]) {
  return rows.reduce((s, r) => s + r.messages, 0);
}

// ─── Main Component ───

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ data }) => {
  const dateLabels = data.category_summary.map((r) => shortDate(r.date));

  // KPI calculations
  const totalRequests = data.category_summary.reduce(
    (s, r) => s + r.total.count,
    0,
  );
  const peakUsers = Math.max(
    ...data.category_summary.map((r) => r.total.users),
  );
  const totalSessions = data.avg_multiturn.reduce((s, r) => s + r.sessions, 0);
  const totalMessages = data.avg_multiturn.reduce((s, r) => s + r.messages, 0);
  const overallAvg =
    totalSessions > 0 ? (totalMessages / totalSessions).toFixed(1) : "0";

  // Category table: simplified — date + category counts + total
  const catHeaders = ["날짜", ...CATEGORIES, "전체"];
  const catRows = data.category_summary.map((r) => [
    shortDate(r.date),
    ...CATEGORIES.map((c) => String(r[c].count)),
    String(r.total.count),
  ]);
  const catTotals = [
    "합계",
    ...CATEGORIES.map((c) =>
      String(data.category_summary.reduce((s, r) => s + r[c].count, 0)),
    ),
    String(totalRequests),
  ];

  // Detail: message daily
  const msgRows = data.message_daily.map((r) => [
    shortDate(r.date),
    String(r.count),
    String(r.users),
  ]);
  const msgTotals = [
    "합계",
    String(sumDailyCount(data.message_daily)),
    String(maxDailyUsers(data.message_daily)) + " (peak)",
  ];

  // Detail: avg multiturn
  const avgRows = data.avg_multiturn.map((r) => [
    shortDate(r.date),
    String(r.sessions),
    String(r.messages),
    String(r.avg),
  ]);
  const avgTotals = [
    "합계",
    String(totalSessions),
    String(totalMessages),
    overallAvg,
  ];

  // Feedback
  const hasFeedback = data.feedback.length > 0;
  const fbRows = data.feedback.map((r) => [
    shortDate(r.date),
    String(r.count),
    String(r.users),
  ]);
  const fbTotals = hasFeedback
    ? [
        "합계",
        String(sumDailyCount(data.feedback)),
        String(maxDailyUsers(data.feedback)) + " (peak)",
      ]
    : undefined;

  return (
    <Html lang="ko">
      <Head />
      <Preview>
        OfficeAgent 리포트 ({data.period.from} ~ {data.period.to})
      </Preview>
      <Body style={main}>
        <table
          width="600"
          align="center"
          cellPadding="0"
          cellSpacing="0"
          style={container}
        >
          <tbody>
            <tr>
              <td>
                {/* ── Header ── */}
                <Header from={data.period.from} to={data.period.to} />

                {/* ── KPI Summary ── */}
                <KpiCards
                  items={[
                    {
                      label: "총 Request",
                      value: String(totalRequests),
                      sub: `일 평균 ${Math.round(totalRequests / data.category_summary.length)}건`,
                      color: "#3b82f6",
                    },
                    {
                      label: "최대 동시 사용자",
                      value: String(peakUsers),
                      sub: "일별 최대 사용자 수",
                      color: "#10b981",
                    },
                    {
                      label: "세션당 평균 대화",
                      value: overallAvg,
                      sub: `총 ${totalSessions}개 세션`,
                      color: "#f59e0b",
                    },
                  ]}
                />

                {/* ── Message Trend ── */}
                <SectionDivider label="메시지 상세" />
                <LineChart
                  title="일별 메시지 추이"
                  labels={dateLabels}
                  datasets={[
                    {
                      label: "건수",
                      data: data.message_daily.map((r) => r.count),
                      color: "#3b82f6",
                    },
                    {
                      label: "사용자",
                      data: data.message_daily.map((r) => r.users),
                      color: "#93c5fd",
                    },
                  ]}
                  height={140}
                />
                <StatTable
                  title="일별 메시지"
                  headers={["날짜", "건수", "사용자"]}
                  rows={msgRows}
                  totals={msgTotals}
                  compact
                />

                {/* ── Category Trend Chart ── */}
                <SectionDivider label="카테고리 추이" />
                <LineChart
                  title="카테고리별 일별 메시지"
                  labels={dateLabels}
                  datasets={CATEGORIES.map((c) => ({
                    label: c,
                    data: data.category_summary.map((r) => r[c].count),
                    color: CAT_COLORS[c],
                  }))}
                />

                {/* ── Category Table (simplified) ── */}
                <StatTable
                  title="카테고리별 메시지 횟수"
                  headers={catHeaders}
                  rows={catRows}
                  totals={catTotals}
                  compact
                />

                {/* ── Multiturn ── */}
                <SectionDivider label="멀티턴 분석" />
                <LineChart
                  title="세션당 평균 대화 길이"
                  labels={dateLabels}
                  datasets={[
                    {
                      label: "세션당 평균",
                      data: data.avg_multiturn.map((r) => r.avg),
                      color: "#f59e0b",
                    },
                  ]}
                  height={140}
                />
                <StatTable
                  title="멀티턴 통계"
                  headers={["날짜", "세션수", "메시지수", "평균"]}
                  rows={avgRows}
                  totals={avgTotals}
                  compact
                />

                {/* ── Feedback (conditional) ── */}
                {hasFeedback && (
                  <>
                    <SectionDivider label="피드백" />
                    <LineChart
                      title="일별 피드백"
                      labels={dateLabels}
                      datasets={[
                        {
                          label: "건수",
                          data: data.feedback.map((r) => r.count),
                          color: "#ec4899",
                        },
                      ]}
                      height={120}
                    />
                    <StatTable
                      title="피드백 통계"
                      headers={["날짜", "건수", "사용자"]}
                      rows={fbRows}
                      totals={fbTotals}
                      compact
                    />
                  </>
                )}

                {/* ── Footer ── */}
                <Footer />
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#e2e8f0",
  padding: "32px 0",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden" as const,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};


export default WeeklyReport;
