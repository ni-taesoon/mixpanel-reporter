import { Section, Heading } from "@react-email/components";
import * as React from "react";

interface StackedBarChartProps {
  title: string;
  labels: string[];
  segments: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  title,
  labels,
  segments,
}) => {
  const totals = labels.map((_, i) =>
    segments.reduce((s, seg) => s + seg.data[i], 0)
  );
  const maxVal = Math.max(...totals, 1);
  const barMaxWidth = 400;

  return (
    <Section style={section}>
      <Heading as="h2" style={heading}>
        {title}
      </Heading>

      {/* 범례 */}
      <table style={{ marginBottom: "12px" }}>
        <tbody>
          <tr>
            {segments.map((seg, i) => (
              <td key={i} style={{ paddingRight: "14px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    backgroundColor: seg.color,
                    marginRight: "4px",
                    verticalAlign: "middle",
                    borderRadius: "2px",
                  }}
                />
                <span style={{ fontSize: "12px", color: "#666" }}>
                  {seg.label}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* 차트 */}
      <table style={chartTable}>
        <tbody>
          {labels.map((label, li) => (
            <tr key={li}>
              <td style={labelCell}>{label}</td>
              <td style={barCell}>
                <table style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      {segments.map((seg, si) => {
                        const w = (seg.data[li] / maxVal) * barMaxWidth;
                        if (seg.data[li] === 0) return null;
                        const isFirst = segments.findIndex((s, idx) => s.data[li] > 0 && idx <= si) === si;
                        const isLast = segments.findLastIndex((s) => s.data[li] > 0) === si;
                        return (
                          <td
                            key={si}
                            style={{
                              backgroundColor: seg.color,
                              width: `${Math.max(w, 2)}px`,
                              height: "18px",
                              borderRadius: `${isFirst ? "3px" : "0"} ${isLast ? "3px" : "0"} ${isLast ? "3px" : "0"} ${isFirst ? "3px" : "0"}`,
                            }}
                          />
                        );
                      })}
                      <td style={totalCell}>{totals[li]}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
};

const section = { margin: "28px 0" };

const heading = {
  color: "#1a1a1a",
  fontSize: "16px",
  fontWeight: "600" as const,
  margin: "0 0 12px",
};

const chartTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "12px",
};

const labelCell: React.CSSProperties = {
  width: "80px",
  textAlign: "right",
  paddingRight: "8px",
  verticalAlign: "middle",
  color: "#555",
  fontSize: "11px",
  whiteSpace: "nowrap",
  paddingBottom: "3px",
};

const barCell: React.CSSProperties = {
  paddingBottom: "3px",
  verticalAlign: "middle",
};

const totalCell: React.CSSProperties = {
  paddingLeft: "6px",
  fontSize: "11px",
  color: "#666",
  whiteSpace: "nowrap",
};
