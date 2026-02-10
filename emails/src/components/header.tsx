import { Section, Text } from "@react-email/components";
import * as React from "react";

interface HeaderProps {
  from: string;
  to: string;
}

export const Header: React.FC<HeaderProps> = ({ from, to }) => {
  const days =
    Math.round(
      (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;
  const weeks = Math.round(days / 7);
  const label = weeks <= 1 ? "1주간 리포트" : `${weeks}주간 리포트`;

  return (
  <Section>
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{
        backgroundColor: "#0f172a",
        borderRadius: "8px 8px 0 0",
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: "32px 20px 28px" }}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tbody>
                <tr>
                  <td>
                    <Text
                      style={{
                        color: "#94a3b8",
                        fontSize: "13px",
                        fontWeight: "600",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase" as const,
                        margin: "0 0 8px",
                        fontFamily:
                          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      }}
                    >
                      OfficeAgent
                    </Text>
                    <Text
                      style={{
                        color: "#f8fafc",
                        fontSize: "26px",
                        fontWeight: "700",
                        margin: "0 0 6px",
                        fontFamily:
                          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        lineHeight: "1.2",
                      }}
                    >
                      {label}{" "}
                      <span
                        style={{
                          backgroundColor: "rgba(59, 130, 246, 0.15)",
                          color: "#93c5fd",
                          padding: "2px 10px",
                          borderRadius: "4px",
                          fontSize: "13px",
                          fontWeight: "500",
                          verticalAlign: "middle",
                        }}
                      >
                        @jiran.com
                      </span>
                    </Text>
                    <Text
                      style={{
                        color: "#64748b",
                        fontSize: "15px",
                        margin: "0",
                        fontFamily:
                          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      }}
                    >
                      {from} — {to}
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </Section>
  );
};
