import { Section, Heading } from "@react-email/components";
import * as React from "react";

interface BarChartProps {
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  labels,
  datasets,
}) => {
  const allValues = datasets.flatMap((ds) => ds.data);
  const maxVal = Math.max(...allValues, 1);
  const barMaxWidth = 320;

  return (
    <Section style={section}>
      <Heading as="h2" style={heading}>
        {title}
      </Heading>

      {/* 범례 */}
      <table style={{ marginBottom: "12px" }}>
        <tbody>
          <tr>
            {datasets.map((ds, i) => (
              <td key={i} style={{ paddingRight: "16px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    backgroundColor: ds.color,
                    marginRight: "4px",
                    verticalAlign: "middle",
                    borderRadius: "2px",
                  }}
                />
                <span style={{ fontSize: "12px", color: "#666" }}>
                  {ds.label}
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
            <React.Fragment key={li}>
              {datasets.map((ds, di) => (
                <tr key={`${li}-${di}`}>
                  {di === 0 ? (
                    <td
                      rowSpan={datasets.length}
                      style={labelCell}
                    >
                      {label}
                    </td>
                  ) : null}
                  <td style={barCell}>
                    <table style={{ borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td
                            style={{
                              backgroundColor: ds.color,
                              width: `${Math.max((ds.data[li] / maxVal) * barMaxWidth, ds.data[li] > 0 ? 2 : 0)}px`,
                              height: "14px",
                              borderRadius: "0 3px 3px 0",
                            }}
                          />
                          <td style={valCell}>
                            {ds.data[li] > 0 ? ds.data[li] : ""}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
              {/* 행 사이 간격 */}
              {li < labels.length - 1 && (
                <tr>
                  <td
                    colSpan={2}
                    style={{ height: "4px", fontSize: "0", lineHeight: "0" }}
                  />
                </tr>
              )}
            </React.Fragment>
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
  verticalAlign: "top",
  color: "#555",
  fontSize: "11px",
  whiteSpace: "nowrap",
};

const barCell: React.CSSProperties = {
  padding: "1px 0",
  verticalAlign: "middle",
};

const valCell: React.CSSProperties = {
  paddingLeft: "4px",
  fontSize: "11px",
  color: "#666",
  whiteSpace: "nowrap",
};
