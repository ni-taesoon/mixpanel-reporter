# Handoff: Mixpanel 통계 이메일 리포트 자동화

## Goal

Mixpanel Raw Event Export API에서 OfficeAgent 이벤트 데이터를 자동 수집하고, 분석 결과를 **HTML 이메일 리포트**(라인 차트 + 테이블)로 만들어 SMTP로 발송하는 시스템 구축.

## Current Progress

### 완료된 작업

1. **`fetch_data.py`** — Mixpanel API 데이터 수집
   - Basic Auth (`.env`의 `MIXPANEL_USERNAME`, `MIXPANEL_PASSWORD`, `MIXPANEL_PROJECT_ID`)
   - `-w / --weeks` 옵션으로 주 단위 기간 지정 (기본 2주)
   - `--from`, `--to`로 직접 날짜 지정도 가능 (지정 시 `--weeks` 무시)
   - 결과를 `mixpanel-data.jsonb` (JSONL) 파일에 저장

2. **`main.py`** — pandas 기반 분석 CLI
   - 기존 CLI 커맨드 (basic, category, web-search, email, attach-msg, agent-msg, plain-msg, avg-msg, feedback, msg-count, all)
   - **`report` 커맨드 추가**: 모든 분석 결과를 JSON으로 stdout 출력
   - JSON에 포함: `category_summary`, `message_daily`, `web_search_daily`, `email_daily`, `attachment_daily`, `agent_daily`, `plain_daily`, `avg_multiturn`, `feedback`

3. **`emails/`** — Node.js + react.email 이메일 템플릿 프로젝트
   - `package.json`: react.email, nodemailer, tsx 등 의존성 (`npm install` 완료)
   - `tsconfig.json`: ESM + react-jsx
   - **컴포넌트**:
     - `src/components/header.tsx` — 리포트 제목 + 기간
     - `src/components/footer.tsx` — 자동 생성 안내 + 타임스탬프
     - `src/components/stat-table.tsx` — 범용 통계 테이블 (headers, rows, totals)
     - `src/components/line-chart.tsx` — SVG 기반 라인 차트 (data URI `<img>` 방식, 이메일 호환)
     - `src/components/bar-chart.tsx` — HTML table 기반 바 차트 (현재 미사용, 라인 차트로 교체됨)
     - `src/components/stacked-bar-chart.tsx` — 스택 바 차트 (현재 미사용)
   - **템플릿**: `src/templates/weekly-report.tsx`
     - 모든 섹션(basic 제외)마다 LineChart + StatTable 쌍으로 구성
     - 카테고리 통합 → 메시지 → 웹 → 이메일 → 문서 → 에이전트 → 일반 → 멀티턴 → 피드백
   - `src/render.ts` — JSON → HTML 파일 렌더링
   - `src/send.ts` — JSON → HTML 렌더링 → nodemailer SMTP 발송
   - ESM 호환: `import.meta.url`로 `__dirname` 대체

4. **`run-report.sh`** — 통합 실행 스크립트
   - `./run-report.sh [주수]` (기본 2주)
   - fetch_data.py → main.py report → send.ts

5. **설정 파일**
   - `.env.example` — Mixpanel + SMTP 환경변수 예시
   - `emails/.env.example` — SMTP 전용
   - `.gitignore` — `.env`, `node_modules`, `report-data.json`, `report.html` 등 제외

### 프로젝트 구조

```
stats/
├── .env                    # Mixpanel 인증 (실제 값)
├── .env.example
├── .gitignore
├── fetch_data.py           # Mixpanel API → JSONL
├── main.py                 # pandas 분석 CLI (report 커맨드 포함)
├── mixpanel-data.jsonb     # 다운로드된 원본 데이터
├── run-report.sh           # 통합 실행
├── docs/
│   └── email-report-plan.md
└── emails/
    ├── .env                # SMTP 설정 (실제 값)
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ├── report-data.json    # 생성된 JSON (gitignore됨)
    ├── report.html         # 생성된 HTML (gitignore됨)
    └── src/
        ├── types.ts
        ├── render.ts
        ├── send.ts
        ├── components/
        │   ├── header.tsx
        │   ├── footer.tsx
        │   ├── stat-table.tsx
        │   ├── line-chart.tsx
        │   ├── bar-chart.tsx        # 미사용
        │   └── stacked-bar-chart.tsx # 미사용
        └── templates/
            └── weekly-report.tsx
```

## What Worked

- **ESM 설정**: `"type": "module"` + `import.meta.url`로 `__dirname` 대체 → Node.js 25 호환
- **SVG 라인 차트**: `<img src="data:image/svg+xml;utf8,...">` 방식으로 이메일 클라이언트 호환 차트 구현
- **react.email `render()`**: `React.createElement()` 호출 + `await render()` 패턴
- **python-dotenv**: `.env` 파일에서 인증 정보 안전하게 로드
- **`--weeks` 옵션**: 기본 2주, 사용자가 원하는 주 수 입력 가능

## What Didn't Work

- **`__dirname` in ESM**: Node.js 25에서 `__dirname` + top-level `await` 조합 시 `ERR_AMBIGUOUS_MODULE_SYNTAX` 에러 → `fileURLToPath(import.meta.url)` 방식으로 해결
- **`import * as nodemailer`**: ESM에서 `import nodemailer from "nodemailer"` 형태로 변경 필요
- **HTML table 기반 바 차트**: 작동은 하지만 시각적으로 라인 차트가 추이 파악에 더 적합하여 교체

## Environment

- `.env` 필수 변수: `MIXPANEL_USERNAME`, `MIXPANEL_PASSWORD`, `MIXPANEL_PROJECT_ID`
- `emails/.env` 필수 변수: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`
- Node.js 25, Python 3, `npm install` 완료 상태

## Next Steps

- [ ] **실제 SMTP 발송 테스트**: `.env`에 실제 SMTP 정보 넣고 `./run-report.sh` 실행하여 이메일 수신 확인
- [ ] **이메일 클라이언트 호환성 테스트**: Gmail, Outlook 등에서 SVG 라인 차트 렌더링 확인 (일부 클라이언트는 data URI 차단 가능 → 대안: 외부 이미지 호스팅 또는 CID 첨부)
- [ ] **미사용 컴포넌트 정리**: `bar-chart.tsx`, `stacked-bar-chart.tsx` 삭제 고려
- [ ] **cron/스케줄러 설정**: 주기적 자동 실행 (예: 매주 월요일 오전)
- [ ] **에러 핸들링 강화**: Mixpanel API 429 재시도, SMTP 연결 실패 시 알림
- [ ] **리포트 디자인 개선**: 사용자 피드백 반영하여 차트/테이블 레이아웃 조정
