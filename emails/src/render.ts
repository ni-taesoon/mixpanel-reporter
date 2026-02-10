import { render } from "@react-email/render";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WeeklyReport } from "./templates/weekly-report.js";
import type { ReportData } from "./types.js";
import React from "react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = process.argv[2] || path.join(__dirname, "..", "report-data.json");
const outputPath = process.argv[3] || path.join(__dirname, "..", "report.html");

const raw = fs.readFileSync(inputPath, "utf-8");
const data: ReportData = JSON.parse(raw);

const html = await render(React.createElement(WeeklyReport, { data }));
fs.writeFileSync(outputPath, html, "utf-8");

console.log(`HTML 렌더링 완료: ${outputPath}`);
