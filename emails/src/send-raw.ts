import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { config } from "dotenv";
import { render } from "@react-email/render";
import React from "react";
import { ExternalReport } from "./templates/external-report.js";
import type { ExternalReportData } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.join(__dirname, "..", ".env") });

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  RAW_DATA_MAIL_FROM,
  RAW_DATA_MAIL_TO,
  RAW_FROM,
  RAW_TO,
  RAW_FILE,
  RAW_EVENT_COUNT,
  RAW_EXTERNAL_REPORT,
} = process.env;

const fromAddress = RAW_DATA_MAIL_FROM || MAIL_FROM;

if (!SMTP_HOST || !fromAddress || !RAW_DATA_MAIL_TO) {
  console.error("오류: .env에 SMTP_HOST, (RAW_DATA_MAIL_FROM 또는 MAIL_FROM), RAW_DATA_MAIL_TO를 설정하세요.");
  process.exit(1);
}

if (!RAW_FROM || !RAW_TO || !RAW_FILE) {
  console.error("오류: RAW_FROM, RAW_TO, RAW_FILE 환경변수가 필요합니다.");
  process.exit(1);
}

const attachmentPath = path.isAbsolute(RAW_FILE)
  ? RAW_FILE
  : path.join(__dirname, "..", RAW_FILE);

if (!fs.existsSync(attachmentPath)) {
  console.error(`오류: 첨부 파일을 찾을 수 없습니다 → ${attachmentPath}`);
  process.exit(1);
}

const filename = path.basename(attachmentPath);
const stat = fs.statSync(attachmentPath);
const sizeKB = (stat.size / 1024).toFixed(1);

let externalReportHtml: string | undefined;
let externalDomainCount = 0;

if (RAW_EXTERNAL_REPORT) {
  const reportPath = path.isAbsolute(RAW_EXTERNAL_REPORT)
    ? RAW_EXTERNAL_REPORT
    : path.join(__dirname, "..", RAW_EXTERNAL_REPORT);

  if (!fs.existsSync(reportPath)) {
    console.error(`오류: 외부 도메인 리포트 파일을 찾을 수 없습니다 → ${reportPath}`);
    process.exit(1);
  }

  const reportRaw = fs.readFileSync(reportPath, "utf-8");
  const reportData: ExternalReportData = JSON.parse(reportRaw);
  externalDomainCount = reportData.domains?.length ?? 0;

  console.log(`외부 도메인 리포트 렌더링 중... (도메인 ${externalDomainCount}개)`);
  externalReportHtml = await render(
    React.createElement(ExternalReport, { data: reportData }),
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT || 587) === 465,
  auth: SMTP_USER
    ? { user: SMTP_USER, pass: SMTP_PASS }
    : undefined,
});

const subject = externalReportHtml
  ? `OfficeAgent 외부 도메인 리포트 (${RAW_FROM} ~ ${RAW_TO})`
  : `OfficeAgent Raw 데이터 (${RAW_FROM} ~ ${RAW_TO})`;

const countLine = RAW_EVENT_COUNT ? `이벤트 수: ${RAW_EVENT_COUNT}건\n` : "";

const text = [
  externalReportHtml
    ? `OfficeAgent 외부 도메인 리포트 및 Mixpanel raw 이벤트 데이터 발송입니다.`
    : `Mixpanel raw 이벤트 데이터 첨부 발송입니다.`,
  ``,
  `기간: ${RAW_FROM} ~ ${RAW_TO} (KST)`,
  externalReportHtml ? `외부 도메인 수: ${externalDomainCount}개` : "",
  `${countLine}첨부 파일: ${filename} (${sizeKB} KB)`,
  ``,
  `압축 해제: gunzip ${filename}`,
]
  .filter(Boolean)
  .join("\n");

console.log(`발송 중: ${fromAddress} → ${RAW_DATA_MAIL_TO}`);
console.log(`첨부: ${attachmentPath} (${sizeKB} KB)`);

const info = await transporter.sendMail({
  from: fromAddress,
  to: RAW_DATA_MAIL_TO,
  subject,
  text,
  ...(externalReportHtml ? { html: externalReportHtml } : {}),
  attachments: [
    {
      filename,
      path: attachmentPath,
    },
  ],
});

console.log(`발송 완료: ${info.messageId}`);
