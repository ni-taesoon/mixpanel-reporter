import { Text } from "@react-email/components";
import * as React from "react";

interface LineChartProps {
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
  height?: number;
}

const W = 556;
const PAD = { top: 16, right: 16, bottom: 36, left: 40 };
const CHART_W = W - PAD.left - PAD.right;

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  if (norm <= 1) return mag;
  if (norm <= 2) return 2 * mag;
  if (norm <= 5) return 5 * mag;
  return 10 * mag;
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  labels,
  datasets,
  height = 180,
}) => {
  const H = height;
  const CHART_H = H - PAD.top - PAD.bottom;

  const allValues = datasets.flatMap((ds) => ds.data);
  const maxVal = niceMax(Math.max(...allValues, 1));
  const n = labels.length;

  const xStep = n > 1 ? CHART_W / (n - 1) : CHART_W;
  const toX = (i: number) => PAD.left + (n > 1 ? i * xStep : CHART_W / 2);
  const toY = (v: number) => PAD.top + CHART_H - (v / maxVal) * CHART_H;

  const yTicks = Array.from({ length: 5 }, (_, i) =>
    Math.round((maxVal / 4) * i),
  );

  const labelInterval = Math.max(1, Math.ceil(n / 10));

  const svg = buildSvg({
    labels,
    datasets,
    maxVal,
    n,
    toX,
    toY,
    yTicks,
    labelInterval,
    W,
    H,
    CHART_H,
  });

  return (
    <table width="100%" cellPadding="0" cellSpacing="0" style={{ margin: "28px 0 0" }}>
      <tbody>
        <tr>
          <td style={{ padding: "0 20px" }}>
      {/* Title + Legend row */}
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tbody>
          <tr>
            <td>
              <Text
                style={{
                  color: "#0f172a",
                  fontSize: "16px",
                  fontWeight: "700",
                  margin: "0 0 4px",
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}
              >
                {title}
              </Text>
            </td>
          </tr>
          {datasets.length > 1 && (
            <tr>
              <td style={{ paddingBottom: "8px" }}>
                <table cellPadding="0" cellSpacing="0">
                  <tbody>
                    <tr>
                      {datasets.map((ds, i) => (
                        <td key={i} style={{ paddingRight: "14px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: "8px",
                              height: "8px",
                              backgroundColor: ds.color,
                              borderRadius: "50%",
                              marginRight: "4px",
                              verticalAlign: "middle",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#64748b",
                              verticalAlign: "middle",
                              fontFamily:
                                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                            }}
                          >
                            {ds.label}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Chart */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
        width={W}
        height={H}
        alt={title}
        style={{
          display: "block",
          maxWidth: "100%",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
        }}
      />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

function buildSvg({
  labels,
  datasets,
  maxVal,
  n,
  toX,
  toY,
  yTicks,
  labelInterval,
  W,
  H,
  CHART_H,
}: {
  labels: string[];
  datasets: LineChartProps["datasets"];
  maxVal: number;
  n: number;
  toX: (i: number) => number;
  toY: (v: number) => number;
  yTicks: number[];
  labelInterval: number;
  W: number;
  H: number;
  CHART_H: number;
}): string {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#f8fafc" rx="6"/>`;

  // Grid lines + Y labels
  for (const tick of yTicks) {
    const y = toY(tick);
    svg += `<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
    svg += `<text x="${PAD.left - 6}" y="${y + 3}" text-anchor="end" font-size="10" fill="#94a3b8" font-family="system-ui, sans-serif">${tick}</text>`;
  }

  // X labels
  for (let i = 0; i < n; i++) {
    if (i % labelInterval !== 0 && i !== n - 1) continue;
    const x = toX(i);
    svg += `<text x="${x}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#94a3b8" font-family="system-ui, sans-serif">${labels[i]}</text>`;
  }

  // Lines + area fill + dots
  for (const ds of datasets) {
    // Area fill
    let area = `<path d="M${toX(0)},${toY(ds.data[0])}`;
    for (let i = 1; i < n; i++) {
      area += `L${toX(i)},${toY(ds.data[i])}`;
    }
    area += `L${toX(n - 1)},${toY(0)}L${toX(0)},${toY(0)}Z"`;
    area += ` fill="${ds.color}" fill-opacity="0.06"/>`;
    svg += area;

    // Smooth line
    let path = `<path d="M${toX(0)},${toY(ds.data[0])}`;
    for (let i = 1; i < n; i++) {
      path += `L${toX(i)},${toY(ds.data[i])}`;
    }
    path += `" fill="none" stroke="${ds.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    svg += path;

    // Dots
    for (let i = 0; i < n; i++) {
      svg += `<circle cx="${toX(i)}" cy="${toY(ds.data[i])}" r="2.5" fill="${ds.color}"/>`;
    }
  }

  svg += `</svg>`;
  return svg;
}
