import { render } from "@react-email/render";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { config } from "dotenv";
import { WeeklyReport } from "./templates/weekly-report.js";
import type { ReportData } from "./types.js";
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

const inputPath = process.argv[2] || path.join(__dirname, "..", "report-data.json");

const raw = fs.readFileSync(inputPath, "utf-8");
const data: ReportData = JSON.parse(raw);

console.log("이메일 렌더링 중...");
const html = await render(React.createElement(WeeklyReport, { data }));

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT || 587) === 465,
  auth: SMTP_USER
    ? { user: SMTP_USER, pass: SMTP_PASS }
    : undefined,
});

const subject = `OfficeAgent 주간 리포트 (${data.period.from} ~ ${data.period.to})`;

console.log(`발송 중: ${MAIL_FROM} → ${MAIL_TO}`);

const info = await transporter.sendMail({
  from: MAIL_FROM,
  to: MAIL_TO,
  subject,
  html,
});

console.log(`발송 완료: ${info.messageId}`);
