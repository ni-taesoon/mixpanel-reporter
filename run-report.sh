#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

WEEKS="${1:-2}"

echo "=== Mixpanel 데이터 수집: 최근 ${WEEKS}주 ==="
python3 "${SCRIPT_DIR}/fetch_data.py" --weeks "${WEEKS}"

echo ""
echo "=== 분석 리포트 생성 ==="
python3 "${SCRIPT_DIR}/main.py" report > "${SCRIPT_DIR}/emails/report-data.json"

echo ""
echo "=== 이메일 발송 ==="
cd "${SCRIPT_DIR}/emails"
npx tsx src/send.ts
