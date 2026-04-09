import { render } from "@react-email/render";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { config } from "dotenv";
import { WeeklyReport } from "./templates/weekly-report.js";
import { ExternalReport } from "./templates/external-report.js";
import type { ReportData, ExternalReportData } from "./types.js";
import React from "react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.join(__dirname, "..", ".env") });

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  MAIL_TO,
} = process.env;

if (!SMTP_HOST || !MAIL_FROM || !MAIL_TO) {
  console.error("오류: .env에 SMTP_HOST, MAIL_FROM, MAIL_TO를 설정하세요.");
  process.exit(1);
}

const mode = process.argv[2] === "external" ? "external" : "internal";
const defaultInput =
  mode === "external"
    ? path.join(__dirname, "..", "external-report-data.json")
    : path.join(__dirname, "..", "report-data.json");
const inputPath =
  mode === "external"
    ? process.argv[3] || defaultInput
    : process.argv[2] || defaultInput;

const raw = fs.readFileSync(inputPath, "utf-8");

let html: string;
let subject: string;

if (mode === "external") {
  const data: ExternalReportData = JSON.parse(raw);
  console.log("외부 도메인 리포트 렌더링 중...");
  html = await render(React.createElement(ExternalReport, { data }));
  subject = `OfficeAgent 외부 도메인 리포트 (${data.period.from} ~ ${data.period.to})`;
} else {
  const data: ReportData = JSON.parse(raw);
  console.log("이메일 렌더링 중...");
  html = await render(React.createElement(WeeklyReport, { data }));
  subject = `OfficeAgent 주간 리포트 (${data.period.from} ~ ${data.period.to})`;
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT || 587) === 465,
  auth: SMTP_USER
    ? { user: SMTP_USER, pass: SMTP_PASS }
    : undefined,
});

console.log(`발송 중: ${MAIL_FROM} → ${MAIL_TO}`);

const info = await transporter.sendMail({
  from: MAIL_FROM,
  to: MAIL_TO,
  subject,
  html,
});

console.log(`발송 완료: ${info.messageId}`);
