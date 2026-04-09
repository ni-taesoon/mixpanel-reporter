#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

WEEKS="${1:-2}"
PREVIEW="${2:-}"

echo "=== Mixpanel 데이터 수집: 최근 ${WEEKS}주 ==="
python3 "${SCRIPT_DIR}/fetch_data.py" --weeks "${WEEKS}"

echo ""
echo "=== 분석 리포트 생성 (@jiran.com) ==="
python3 "${SCRIPT_DIR}/main.py" report > "${SCRIPT_DIR}/emails/report-data.json"

echo ""
echo "=== 외부 도메인 리포트 생성 ==="
python3 "${SCRIPT_DIR}/main.py" external-report > "${SCRIPT_DIR}/emails/external-report-data.json"

cd "${SCRIPT_DIR}/emails"

if [ "${PREVIEW}" = "preview" ]; then
  echo ""
  echo "=== HTML 프리뷰 생성 (발송 안 함) ==="
  npx tsx src/render.ts
  npx tsx src/render.ts external
  echo ""
  echo "프리뷰 파일:"
  echo "  jiran.com  → ${SCRIPT_DIR}/emails/report.html"
  echo "  외부 도메인 → ${SCRIPT_DIR}/emails/external-report.html"
  open "${SCRIPT_DIR}/emails/report.html"
  open "${SCRIPT_DIR}/emails/external-report.html"
else
  echo ""
  echo "=== 이메일 발송 (@jiran.com) ==="
  npx tsx src/send.ts

  echo ""
  echo "=== 외부 도메인 이메일 발송 ==="
  npx tsx src/send.ts external
fi
