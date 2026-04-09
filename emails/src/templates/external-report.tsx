import { Body, Head, Html, Preview, Section, Text } from "@react-email/components";
import * as React from "react";
import type { ExternalReportData, ExternalDomainData, DailyRow, SessionDailyRow } from "../types.js";
import { KpiCards } from "../components/kpi-cards.js";
import { LineChart } from "../components/line-chart.js";
import { StatTable } from "../components/stat-table.js";
import { SectionDivider } from "../components/section-divider.js";
import { Footer } from "../components/footer.js";

interface ExternalReportProps {
  data: ExternalReportData;
}

const DOMAIN_COLORS = [
  "#e11d48", "#7c3aed", "#0891b2", "#ca8a04", "#059669",
  "#dc2626", "#6366f1", "#0284c7", "#d97706", "#16a34a",
];

const CATEGORIES = ["웹", "이메일", "문서", "에이전트", "일반"] as const;

const CAT_COLORS: Record<string, string> = {
  웹: "#3b82f6",
  이메일: "#8b5cf6",
  문서: "#f59e0b",
  에이전트: "#10b981",
  일반: "#64748b",
};

function shortDate(d: string) {
  return d.slice(5);
}

function sumDailyCount(rows: DailyRow[]) {
  return rows.reduce((s, r) => s + r.count, 0);
}

function maxDailyUsers(rows: DailyRow[]) {
  return Math.max(0, ...rows.map((r) => r.users));
}

// ─── Domain Card (jiran.com과 동일한 구조) ───

const DomainCard: React.FC<{ d: ExternalDomainData; color: string }> = ({
  d,
  color,
}) => {
  const dateLabels = d.category_summary.map((r) => shortDate(r.date));
  const totalRequests = d.category_summary.reduce(
    (s, r) => s + r.total.count,
    0,
  );
  const peakUsers = Math.max(
    0,
    ...d.category_summary.map((r) => r.total.users),
  );
  const totalSessions = d.avg_multiturn.reduce((s, r) => s + r.sessions, 0);
  const totalMessages = d.avg_multiturn.reduce((s, r) => s + r.messages, 0);
  const overallAvg =
    totalSessions > 0 ? (totalMessages / totalSessions).toFixed(1) : "0";

  const catHeaders = ["날짜", ...CATEGORIES, "전체"];
  const catRows = d.category_summary.map((r) => [
    shortDate(r.date),
    ...CATEGORIES.map((c) => String(r[c].count)),
    String(r.total.count),
  ]);
  const catTotals = [
    "합계",
    ...CATEGORIES.map((c) =>
      String(d.category_summary.reduce((s, r) => s + r[c].count, 0)),
    ),
    String(totalRequests),
  ];

  const msgRows = d.message_daily.map((r) => [
    shortDate(r.date),
    String(r.count),
    String(r.users),
  ]);
  const msgTotals = [
    "합계",
    String(sumDailyCount(d.message_daily)),
    String(maxDailyUsers(d.message_daily)) + " (peak)",
  ];

  const avgRows = d.avg_multiturn.map((r) => [
    shortDate(r.date),
    String(r.sessions),
    String(r.messages),
    String(r.avg),
  ]);
  const avgTotals = ["합계", String(totalSessions), String(totalMessages), overallAvg];

  const hasFeedback = d.feedback.length > 0;
  const fbRows = d.feedback.map((r) => [
    shortDate(r.date),
    String(r.count),
    String(r.users),
  ]);
  const fbTotals = hasFeedback
    ? [
        "합계",
        String(sumDailyCount(d.feedback)),
        String(maxDailyUsers(d.feedback)) + " (peak)",
      ]
    : undefined;

  if (totalRequests === 0) {
    return (
      <div style={{ padding: "16px", backgroundColor: "#fafbfc" }}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td style={userListHeader}>
                사용자 목록 ({d.total_users}명) — 메시지 기록 없음
              </td>
            </tr>
            {d.users.map((u, j) => (
              <tr key={j}>
                <td style={userRow}>{u}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", backgroundColor: "#fafbfc" }}>
      {/* KPI */}
      <KpiCards
        items={[
          {
            label: "총 Request",
            value: String(totalRequests),
            sub: `일 평균 ${Math.round(totalRequests / d.category_summary.length)}건`,
            color,
          },
          {
            label: "최대 동시 사용자",
            value: String(peakUsers),
            sub: "일별 최대",
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

      {/* Message Trend */}
      <LineChart
        title="일별 메시지 추이"
        labels={dateLabels}
        datasets={[
          {
            label: "건수",
            data: d.message_daily.map((r) => r.count),
            color,
          },
          {
            label: "사용자",
            data: d.message_daily.map((r) => r.users),
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

      {/* Category Trend */}
      <LineChart
        title="카테고리별 일별 메시지"
        labels={dateLabels}
        datasets={CATEGORIES.map((c) => ({
          label: c,
          data: d.category_summary.map((r) => r[c].count),
          color: CAT_COLORS[c],
        }))}
      />
      <StatTable
        title="카테고리별 메시지 횟수"
        headers={catHeaders}
        rows={catRows}
        totals={catTotals}
        compact
      />

      {/* Multiturn */}
      <LineChart
        title="세션당 평균 대화 길이"
        labels={dateLabels}
        datasets={[
          {
            label: "세션당 평균",
            data: d.avg_multiturn.map((r) => r.avg),
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

      {/* Feedback */}
      {hasFeedback && (
        <>
          <LineChart
            title="일별 피드백"
            labels={dateLabels}
            datasets={[
              {
                label: "건수",
                data: d.feedback.map((r) => r.count),
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

      {/* User list */}
      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{ marginTop: "12px" }}
      >
        <tbody>
          <tr>
            <td style={userListHeader}>사용자 목록 ({d.total_users}명)</td>
          </tr>
          {d.users.map((u, j) => (
            <tr key={j}>
              <td style={userRow}>{u}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Component ───

export const ExternalReport: React.FC<ExternalReportProps> = ({ data }) => {
  const totalMessages = data.domains.reduce(
    (s, d) => s + d.category_summary.reduce((ss, r) => ss + r.total.count, 0),
    0,
  );
  const totalUsers = new Set(data.domains.flatMap((d) => d.users)).size;
  const totalDomains = data.domains.filter(
    (d) => d.category_summary.some((r) => r.total.count > 0),
  ).length;

  return (
    <Html lang="ko">
      <Head />
      <Preview>
        OfficeAgent 외부 도메인 리포트 ({data.period.from} ~ {data.period.to})
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
                <Section>
                  <table
                    width="100%"
                    cellPadding="0"
                    cellSpacing="0"
                    style={{
                      backgroundColor: "#1e293b",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ padding: "32px 20px 28px" }}>
                          <Text style={headerSub}>OfficeAgent</Text>
                          <Text style={headerTitle}>
                            외부 도메인 리포트{" "}
                            <span style={headerBadge}>External</span>
                          </Text>
                          <Text style={headerDate}>
                            {data.period.from} — {data.period.to}
                          </Text>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Section>

                {/* ── Overall KPI ── */}
                <KpiCards
                  items={[
                    {
                      label: "총 메시지",
                      value: String(totalMessages),
                      sub: `${totalDomains}개 도메인`,
                      color: "#e11d48",
                    },
                    {
                      label: "사용자 수",
                      value: String(totalUsers),
                      sub: "고유 사용자",
                      color: "#7c3aed",
                    },
                    {
                      label: "도메인 수",
                      value: String(data.domains.length),
                      sub: `활성 ${totalDomains}개`,
                      color: "#0891b2",
                    },
                  ]}
                />

                {/* ── Domain Cards ── */}
                {data.domains.map((d, i) => {
                  const color = DOMAIN_COLORS[i % DOMAIN_COLORS.length];
                  return (
                    <React.Fragment key={i}>
                      <SectionDivider label={d.domain} />
                      <div
                        style={{
                          margin: "0 16px 20px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          overflow: "hidden" as const,
                        }}
                      >
                        {/* Card header */}
                        <table
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ borderCollapse: "collapse" as const }}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  backgroundColor: color,
                                }}
                              >
                                <span style={cardTitle}>{d.domain}</span>
                                <span style={cardSub}>
                                  {d.total_users}명 · {d.category_summary.reduce((s, r) => s + r.total.count, 0)}건
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Card body — full analysis */}
                        <DomainCard d={d} color={color} />
                      </div>
                    </React.Fragment>
                  );
                })}

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

// ─── Styles ───

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

const headerSub = {
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: "600" as const,
  letterSpacing: "1.5px",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
};

const headerTitle = {
  color: "#f8fafc",
  fontSize: "26px",
  fontWeight: "700" as const,
  margin: "0 0 6px",
  lineHeight: "1.2",
};

const headerBadge: React.CSSProperties = {
  backgroundColor: "rgba(225, 29, 72, 0.15)",
  color: "#fda4af",
  padding: "2px 10px",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: "500",
  verticalAlign: "middle",
};

const headerDate = {
  color: "#64748b",
  fontSize: "15px",
  margin: "0",
};

const cardTitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "700",
};

const cardSub: React.CSSProperties = {
  color: "rgba(255,255,255,0.8)",
  fontSize: "13px",
  marginLeft: "10px",
};

const userListHeader: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#475569",
  padding: "6px 0",
  borderBottom: "1px solid #e2e8f0",
};

const userRow: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
  padding: "3px 0",
};

export default ExternalReport;
