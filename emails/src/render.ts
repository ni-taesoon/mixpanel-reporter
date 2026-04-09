import { render } from "@react-email/render";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WeeklyReport } from "./templates/weekly-report.js";
import { ExternalReport } from "./templates/external-report.js";
import type { ReportData, ExternalReportData } from "./types.js";
import React from "react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mode = process.argv[2] === "external" ? "external" : "internal";

const defaultInput =
  mode === "external"
    ? path.join(__dirname, "..", "external-report-data.json")
    : path.join(__dirname, "..", "report-data.json");
const defaultOutput =
  mode === "external"
    ? path.join(__dirname, "..", "external-report.html")
    : path.join(__dirname, "..", "report.html");

const inputPath = mode === "external" ? (process.argv[3] || defaultInput) : (process.argv[2] || defaultInput);
const outputPath = mode === "external" ? (process.argv[4] || defaultOutput) : (process.argv[3] || defaultOutput);

const raw = fs.readFileSync(inputPath, "utf-8");

let html: string;
if (mode === "external") {
  const data: ExternalReportData = JSON.parse(raw);
  html = await render(React.createElement(ExternalReport, { data }));
} else {
  const data: ReportData = JSON.parse(raw);
  html = await render(React.createElement(WeeklyReport, { data }));
}

fs.writeFileSync(outputPath, html, "utf-8");
console.log(`HTML 렌더링 완료: ${outputPath}`);
