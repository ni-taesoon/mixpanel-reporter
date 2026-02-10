import { Text } from "@react-email/components";
import * as React from "react";

export interface KpiItem {
  label: string;
  value: string;
  sub?: string;
  color: string;
}

interface KpiCardsProps {
  items: KpiItem[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ items }) => (
  <table width="100%" cellPadding="0" cellSpacing="0">
    <tbody>
      <tr>
        <td style={{ padding: "0 20px" }}>
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{ margin: "24px 0 8px" }}
    >
      <tbody>
        <tr>
          {items.map((item, i) => (
            <td
              key={i}
              width={`${Math.floor(100 / items.length)}%`}
              style={{
                paddingRight: i < items.length - 1 ? "12px" : "0",
                verticalAlign: "top",
              }}
            >
              <table
                width="100%"
                cellPadding="0"
                cellSpacing="0"
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "6px",
                  borderTop: `3px solid ${item.color}`,
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: "16px 16px 14px" }}>
                      <Text
                        style={{
                          color: "#64748b",
                          fontSize: "13px",
                          fontWeight: "600",
                          letterSpacing: "0.5px",
                          margin: "0 0 6px",
                          fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={{
                          color: "#0f172a",
                          fontSize: "32px",
                          fontWeight: "800",
                          margin: "0",
                          lineHeight: "1",
                          fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        }}
                      >
                        {item.value}
                      </Text>
                      {item.sub && (
                        <Text
                          style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                            margin: "6px 0 0",
                            fontFamily:
                              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          }}
                        >
                          {item.sub}
                        </Text>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
        </td>
      </tr>
    </tbody>
  </table>
);
