# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mixpanel 이벤트 데이터를 수집·분석하여 주간 HTML 이메일 리포트를 자동 발송하는 파이프라인. OfficeAgent 제품의 @jiran.com 사용자 활동을 추적한다.

## Commands

### Full pipeline (fetch → analyze → email)
```bash
./run-report.sh          # 기본 2주
./run-report.sh 4        # 4주
```

### Data collection
```bash
python3 fetch_data.py --weeks 2
python3 fetch_data.py --from 2025-01-20 --to 2025-01-26
```

### Analysis CLI
```bash
python3 main.py report          # JSON output (used by email pipeline)
python3 main.py all             # All analyses to terminal
python3 main.py category        # Single analysis: category, msg-count, avg-msg, feedback, web-search, email, attach-msg, agent-msg, plain-msg, basic
```

### Email rendering & sending
```bash
cd emails && npm install
cd emails && npx tsx src/render.ts   # JSON → HTML file only
cd emails && npx tsx src/send.ts     # JSON → HTML → SMTP send
cd emails && npm run preview         # react.email dev preview
```

### Daily raw data attachment (독립 파이프라인)
매일 KST 08시 (`.github/workflows/daily-raw-export.yml`) 최근 7일 raw JSONL을 gzip 압축 후 `RAW_DATA_MAIL_TO`로 첨부 발송. 발송 스크립트: `emails/src/send-raw.ts` (env: `RAW_FROM`, `RAW_TO`, `RAW_FILE`, `RAW_EVENT_COUNT`).

## Architecture

4-phase pipeline, orchestrated by `run-report.sh`:

```
Phase 1: fetch_data.py    Mixpanel API (Basic Auth) → mixpanel-data.jsonb (JSONL)
Phase 2: main.py report   JSONL → pandas analysis → JSON to stdout → emails/report-data.json
Phase 3: render.ts        JSON → React components → @react-email/render → HTML
Phase 4: send.ts          HTML → nodemailer → SMTP delivery
```

**Python side** (`fetch_data.py`, `main.py`): pandas for analysis, python-dotenv for credentials, argparse for CLI. All dates are converted UTC → Asia/Seoul.

**Node.js side** (`emails/`): ESM modules (`"type": "module"`), TypeScript via `tsx`, React 19 + @react-email/components. Charts are SVG embedded as `data:image/svg+xml` URIs for email client compatibility.

### Category classification (priority order in main.py)
1. 웹 (Web): `tools_used` contains "web_search"
2. 이메일 (Email): `tools_used` contains "email"
3. 문서 (Document): session has attachments
4. 에이전트 (Agent): session has agent_id
5. 일반 (Plain): none of the above

### Report data shape (TypeScript: `emails/src/types.ts`)
`ReportData` contains: `period`, `category_summary`, `message_daily`, `avg_multiturn`, `web_search_daily`, `email_daily`, `attachment_daily`, `agent_daily`, `plain_daily`, `feedback`. Each section has rows with date + metrics.

## Environment Variables

- Root `.env`: `MIXPANEL_USERNAME`, `MIXPANEL_PASSWORD`, `MIXPANEL_PROJECT_ID`
- `emails/.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`, `RAW_DATA_MAIL_TO`

## Key Technical Decisions

- **SVG line charts in email**: Built as inline SVG strings in `line-chart.tsx`, embedded as data URIs. Some email clients may block data URIs.
- **ESM compatibility**: Uses `import.meta.url` + `fileURLToPath` instead of `__dirname`. Import nodemailer as default import, not namespace.
- **JSONL format**: `mixpanel-data.jsonb` is newline-delimited JSON, not standard JSON array.
- **Unused components**: `bar-chart.tsx`, `stacked-bar-chart.tsx`, `tabbed-section.tsx` are superseded by line-chart but kept in the codebase.

## Conventions

- UI labels and column names are in Korean (한글)
- 테스트 코드 작성 시 테스트 이름은 한글로 작성
- PR 작성 시 한글로 작성
