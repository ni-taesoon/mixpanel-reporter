import { Text } from "@react-email/components";
import * as React from "react";

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

interface StatTableProps {
  title: string;
  headers: string[];
  rows: string[][];
  totals?: string[];
  compact?: boolean;
}

export const StatTable: React.FC<StatTableProps> = ({
  title,
  headers,
  rows,
  totals,
  compact = false,
}) => (
  <table width="100%" cellPadding="0" cellSpacing="0" style={{ margin: compact ? "20px 0" : "24px 0" }}>
    <tbody>
      <tr>
        <td style={{ padding: "0 20px" }}>
    <Text
      style={{
        color: "#0f172a",
        fontSize: "16px",
        fontWeight: "700",
        margin: "0 0 8px",
        fontFamily: FONT,
      }}
    >
      {title}
    </Text>
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{
        borderCollapse: "collapse",
        fontSize: compact ? "13px" : "14px",
        fontFamily: FONT,
        width: "100%",
      }}
    >
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th
              key={i}
              style={{
                backgroundColor: "#f1f5f9",
                borderBottom: "2px solid #e2e8f0",
                padding: compact ? "7px 6px" : "9px 8px",
                textAlign: i === 0 ? "left" : "right",
                fontWeight: "600",
                color: "#475569",
                fontSize: compact ? "13px" : "14px",
                fontFamily: FONT,
                whiteSpace: "nowrap" as const,
                ...(i === 0 ? { width: "70px" } : {}),
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td
                key={ci}
                style={{
                  borderBottom: "1px solid #f1f5f9",
                  padding: compact ? "6px 6px" : "8px 8px",
                  textAlign: ci === 0 ? "left" : "right",
                  color: ci === 0 ? "#64748b" : "#0f172a",
                  fontWeight: ci === 0 ? "400" : "500",
                  fontFamily: FONT,
                  whiteSpace: "nowrap" as const,
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
        {totals && (
          <tr>
            {totals.map((cell, ci) => (
              <td
                key={ci}
                style={{
                  borderTop: "2px solid #cbd5e1",
                  padding: compact ? "7px 6px" : "9px 8px",
                  textAlign: ci === 0 ? "left" : "right",
                  fontWeight: "700",
                  color: "#0f172a",
                  backgroundColor: "#f8fafc",
                  fontFamily: FONT,
                  whiteSpace: "nowrap" as const,
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
        </td>
      </tr>
    </tbody>
  </table>
);
