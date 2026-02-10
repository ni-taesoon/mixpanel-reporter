import { Section, Text } from "@react-email/components";
import * as React from "react";

export const Footer: React.FC = () => (
  <Section>
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{
        backgroundColor: "#f8fafc",
        borderRadius: "0 0 8px 8px",
        borderTop: "1px solid #e2e8f0",
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: "16px 20px" }}>
            <Text
              style={{
                color: "#94a3b8",
                fontSize: "13px",
                margin: "0 0 2px",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              }}
            >
              Mixpanel 데이터 기반 자동 생성 리포트
            </Text>
            <Text
              style={{
                color: "#cbd5e1",
                fontSize: "12px",
                margin: "0",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              }}
            >
              {new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  </Section>
);
