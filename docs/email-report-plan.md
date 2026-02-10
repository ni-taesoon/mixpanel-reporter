# Mixpanel 통계 이메일 리포트 자동화 계획

## 개요

Mixpanel Raw Event Export API로 데이터를 자동 수집하고, 분석 결과를 HTML 이메일 리포트로 만들어 발송하는 시스템.

## 현재 상태

- `main.py`: 로컬 JSONL 파일(`mixpanel-data.jsonb`)을 읽어 pandas로 분석 후 터미널 출력
- 분석 항목: 카테고리별 통합 통계, 웹/이메일/문서/에이전트/일반 채팅 일별 통계, 세션당 평균 멀티턴, 피드백 등

## 아키텍처

```
[Phase 1] Python: Mixpanel API → JSONL 파일 다운로드
[Phase 2] Python: JSONL → pandas 분석 → JSON 결과 출력
[Phase 3] Node.js: JSON 결과 → react.email 템플릿 → HTML 렌더링
[Phase 4] Node.js: HTML 이메일 발송 (nodemailer 또는 Resend)
```

---

## Phase 1: Mixpanel 데이터 수집 (`fetch_data.py`)

### API 정보

- **Endpoint**: `GET https://data.mixpanel.com/api/2.0/export`
- **인증**: HTTP Basic Auth (Service Account username/password)
- **응답**: JSONL (한 줄에 하나의 JSON 이벤트)
- **Rate Limit**: 60 queries/hour, 3 queries/second

### 구현 내용

- `.env` 파일에서 인증 정보 로드 (`python-dotenv`)
- CLI 인자로 `from_date`, `to_date` 지정 (기본: 최근 7일)
- 다운로드한 데이터를 `mixpanel-data.jsonb`에 저장 (기존 파일 덮어쓰기)

### .env 파일 형식

```env
MIXPANEL_USERNAME=your_service_account_username
MIXPANEL_PASSWORD=your_service_account_password
MIXPANEL_PROJECT_ID=your_project_id
```

### 필요 패키지

```
requests
python-dotenv
```

---

## Phase 2: 분석 결과 JSON 출력 (`main.py` 수정)

### 수정 내용

- 기존 `main.py`에 `report` 커맨드 추가
- `report` 실행 시 모든 분석 결과를 **JSON 형식**으로 stdout 또는 파일에 출력
- JSON 구조 예시:

```json
{
  "period": { "from": "2025-01-20", "to": "2025-01-26" },
  "category_summary": {
    "dates": ["2025-01-20", ...],
    "categories": {
      "웹": { "counts": [10, 12, ...], "users": [3, 4, ...] },
      "이메일": { ... },
      ...
    },
    "totals": { ... }
  },
  "message_daily": { ... },
  "avg_multiturn": { ... },
  "feedback": { ... }
}
```

---

## Phase 3: react.email 템플릿 (`emails/` 디렉토리)

### 프로젝트 셋업

```bash
npm init -y
npm install react @react-email/components @react-email/render
npm install -D typescript @types/react tsx
```

### 디렉토리 구조

```
emails/
├── package.json
├── tsconfig.json
├── src/
│   ├── templates/
│   │   └── weekly-report.tsx    # 주간 리포트 템플릿
│   ├── components/
│   │   ├── stat-table.tsx       # 통계 테이블 컴포넌트
│   │   ├── header.tsx           # 이메일 헤더
│   │   └── footer.tsx           # 이메일 푸터
│   ├── render.ts                # JSON → HTML 렌더링 스크립트
│   └── send.ts                  # 이메일 발송 스크립트
└── .env                         # 발송 설정 (SMTP 등)
```

### 템플릿 주요 구성

1. **헤더**: 로고, 리포트 기간
2. **카테고리별 통합 통계 테이블**: 일별 × 카테고리 매트릭스
3. **일별 메시지 통계**: 건수, 사용자수
4. **세션당 평균 멀티턴**: 세션수, 메시지수, 평균
5. **피드백 통계**: 좋아요/싫어요
6. **푸터**: 생성 일시

### 렌더링 흐름

```typescript
// render.ts
import { render } from '@react-email/components';
import { WeeklyReport } from './templates/weekly-report';

const data = JSON.parse(fs.readFileSync('report-data.json', 'utf-8'));
const html = await render(<WeeklyReport data={data} />);
fs.writeFileSync('report.html', html);
```

---

## Phase 4: 이메일 발송

### 옵션 A: Nodemailer (SMTP)

- 사내 SMTP 서버 또는 Gmail SMTP 사용
- `.env`에 SMTP 설정 저장

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
MAIL_FROM=stats@example.com
MAIL_TO=team@example.com
```

### 옵션 B: Resend API

- react.email과 같은 팀에서 만든 이메일 발송 서비스
- API Key 기반, 간편한 설정

---

## 실행 플로우 (최종)

```bash
# 1. 데이터 수집
python fetch_data.py --from 2025-01-20 --to 2025-01-26

# 2. 분석 → JSON 출력
python main.py report > emails/report-data.json

# 3. HTML 렌더링 + 이메일 발송
cd emails && npx tsx src/send.ts
```

또는 하나의 쉘 스크립트로 통합:

```bash
#!/bin/bash
# run-report.sh
python fetch_data.py --from "$1" --to "$2"
python main.py report > emails/report-data.json
cd emails && npx tsx src/send.ts
```

---

## 작업 순서

| 순서 | 작업 | 설명 |
|------|------|------|
| 1 | `fetch_data.py` 생성 | Mixpanel API 연동, .env 인증, JSONL 저장 |
| 2 | `main.py`에 `report` 커맨드 추가 | 전체 분석 결과를 JSON으로 출력 |
| 3 | `emails/` Node.js 프로젝트 초기화 | package.json, tsconfig.json 설정 |
| 4 | react.email 템플릿 개발 | 테이블, 헤더/푸터 컴포넌트 |
| 5 | 렌더링 스크립트 작성 | JSON → HTML 변환 |
| 6 | 이메일 발송 스크립트 작성 | SMTP 또는 Resend 연동 |
| 7 | 통합 실행 스크립트 | `run-report.sh` |
| 8 | `.gitignore`, `.env.example` 정리 | 민감 정보 제외 |
