import { Heading, Section } from "@react-email/components";
import * as React from "react";

export interface Tab {
  label: string;
  color: string;
  content: React.ReactNode;
}

interface TabbedSectionProps {
  title: string;
  tabs: Tab[];
}

export const TabbedSection: React.FC<TabbedSectionProps> = ({
  title,
  tabs,
}) => (
  <Section style={section}>
    <Heading as="h2" style={heading}>
      {title}
    </Heading>

    {/* 탭 헤더 */}
    <table style={tabBar}>
      <tbody>
        <tr>
          {tabs.map((tab, i) => (
            <td key={i} style={{ padding: "0" }}>
              <div
                style={{
                  ...tabHeaderBase,
                  borderBottom: `3px solid ${tab.color}`,
                  color: tab.color,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    backgroundColor: tab.color,
                    borderRadius: "50%",
                    marginRight: "6px",
                    verticalAlign: "middle",
                  }}
                />
                {tab.label}
              </div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>

    {/* 탭 컨텐츠 */}
    {tabs.map((tab, i) => (
      <div
        key={i}
        style={{
          ...tabContent,
          borderLeft: `3px solid ${tab.color}`,
        }}
      >
        {tab.content}
      </div>
    ))}
  </Section>
);

const section = { margin: "28px 0" };

const heading = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "700" as const,
  margin: "0 0 16px",
};

const tabBar: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const tabHeaderBase: React.CSSProperties = {
  padding: "10px 8px",
  fontSize: "13px",
  fontWeight: "600",
  textAlign: "center",
  backgroundColor: "#fafafa",
};

const tabContent: React.CSSProperties = {
  padding: "16px 16px 8px",
  marginBottom: "4px",
  backgroundColor: "#fafbfc",
};
