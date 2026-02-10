"""Mixpanel Raw Event Export API에서 이벤트 데이터를 다운로드한다."""

import argparse
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

DATA_FILE = Path(__file__).parent / "mixpanel-data.jsonb"

API_URL = "https://data.mixpanel.com/api/2.0/export"


def fetch_events(from_date: str, to_date: str) -> str:
    """Mixpanel Export API를 호출하여 JSONL 텍스트를 반환한다."""
    username = os.environ.get("MIXPANEL_USERNAME")
    password = os.environ.get("MIXPANEL_PASSWORD")
    project_id = os.environ.get("MIXPANEL_PROJECT_ID")

    if not username or not password:
        print("오류: .env에 MIXPANEL_USERNAME, MIXPANEL_PASSWORD를 설정하세요.", file=sys.stderr)
        sys.exit(1)

    params = {
        "from_date": from_date,
        "to_date": to_date,
    }
    if project_id:
        params["project_id"] = project_id

    resp = requests.get(
        API_URL,
        params=params,
        auth=(username, password),
        headers={"Accept-Encoding": "gzip"},
        stream=True,
    )

    if resp.status_code == 429:
        print("오류: Rate limit 초과. 잠시 후 다시 시도하세요.", file=sys.stderr)
        sys.exit(1)

    resp.raise_for_status()
    return resp.text


def main() -> None:
    parser = argparse.ArgumentParser(description="Mixpanel 데이터 다운로드")
    today = datetime.utcnow().date()

    parser.add_argument("-w", "--weeks", type=int, default=2,
                        help="가져올 주 수 (기본: 2)")
    parser.add_argument("--from", dest="from_date", default=None,
                        help="시작일 (yyyy-mm-dd, 지정하면 --weeks 무시)")
    parser.add_argument("--to", dest="to_date", default=str(today),
                        help="종료일 (yyyy-mm-dd, 기본: 오늘)")
    parser.add_argument("-o", "--output", default=str(DATA_FILE),
                        help=f"출력 파일 경로 (기본: {DATA_FILE})")
    args = parser.parse_args()

    if args.from_date is None:
        args.from_date = str(today - timedelta(weeks=args.weeks))

    print(f"Mixpanel 데이터 다운로드: {args.from_date} ~ {args.to_date}")
    data = fetch_events(args.from_date, args.to_date)

    out = Path(args.output)
    out.write_text(data, encoding="utf-8")

    line_count = data.count("\n")
    print(f"완료: {line_count}건 → {out}")


if __name__ == "__main__":
    main()
