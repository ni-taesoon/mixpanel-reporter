import * as React from "react";

interface SectionDividerProps {
  label?: string;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({ label }) => (
  <table width="100%" cellPadding="0" cellSpacing="0" style={{ margin: "40px 0 4px" }}>
    <tbody>
      <tr>
        <td style={{ padding: "0 20px" }}>
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <td
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  {label && (
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: "#f1f5f9",
                        color: "#475569",
                        fontSize: "12px",
                        fontWeight: "700",
                        letterSpacing: "1px",
                        textTransform: "uppercase" as const,
                        padding: "4px 10px",
                        borderRadius: "4px 4px 0 0",
                        fontFamily:
                          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      }}
                    >
                      {label}
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
);
