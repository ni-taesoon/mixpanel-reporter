import argparse
import json
import sys

import pandas as pd
from pathlib import Path

DATA_FILE = Path(__file__).parent / "mixpanel-data.jsonb"


def load_mixpanel_data(file_path: Path) -> pd.DataFrame:
    """JSONL 파일을 읽어 평탄화된 DataFrame으로 반환한다."""
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if not stripped:
                continue
            row = json.loads(stripped)
            flat = {"event": row.get("event")}
            props = row.get("properties", {})
            for key, value in props.items():
                flat[key] = value
            records.append(flat)

    df = pd.DataFrame(records)

    if "timestamp" in df.columns:
        df["timestamp"] = (
            pd.to_datetime(df["timestamp"], errors="coerce")
            .dt.tz_localize("UTC")
            .dt.tz_convert("Asia/Seoul")
        )

    return df


def print_basic_stats(df: pd.DataFrame) -> None:
    """기본 통계 요약을 출력한다."""
    print("=" * 60)
    print(f"총 이벤트 수: {len(df):,}")
    print(f"컬럼 수: {len(df.columns)}")
    print(f"이벤트 종류: {df['event'].nunique()}")
    print("=" * 60)

    print("\n[이벤트별 발생 횟수]")
    print(df["event"].value_counts().to_string())

    print("\n[고유 사용자 수]")
    if "distinct_id" in df.columns:
        print(f"  distinct_id 기준: {df['distinct_id'].nunique()}")

    print("\n[기간]")
    if "timestamp" in df.columns:
        ts = df["timestamp"].dropna()
        if not ts.empty:
            print(f"  시작: {ts.min()}")
            print(f"  종료: {ts.max()}")

    print("\n[브라우저 분포]")
    if "$browser" in df.columns:
        print(df["$browser"].value_counts().to_string())

    print("\n[OS 분포]")
    if "$os" in df.columns:
        print(df["$os"].value_counts().to_string())

    print("\n[도시 분포]")
    if "$city" in df.columns:
        print(df["$city"].value_counts().head(10).to_string())


EXCLUDED_DOMAINS = {"jiran.com", "nextintelligence.ai", "test.com", "test2.com", "test4.com"}


def _filter_jiran(df: pd.DataFrame) -> pd.DataFrame:
    """distinct_id가 @jiran.com인 행만 반환한다."""
    return df[df["distinct_id"].str.contains("@jiran.com", na=False)]


def _filter_external(df: pd.DataFrame) -> pd.DataFrame:
    """제외 도메인(jiran.com, nextintelligence.ai, test*)을 뺀 외부 사용자 행만 반환한다."""
    mask = df["distinct_id"].str.contains("@", na=False)
    filtered = df[mask].copy()
    filtered["_domain"] = filtered["distinct_id"].str.split("@").str[1]
    return filtered[~filtered["_domain"].isin(EXCLUDED_DOMAINS)]


def _fill_missing_dates(daily: pd.DataFrame, min_date, max_date) -> pd.DataFrame:
    """date 인덱스의 빈 날짜를 0으로 채운다."""
    if daily.empty:
        return daily
    all_dates = pd.date_range(start=min_date, end=max_date, freq="D").date
    return daily.reindex(all_dates, fill_value=0)


def _print_tsv(df: pd.DataFrame) -> None:
    """DataFrame을 TSV(탭 구분) 형식으로 출력한다."""
    print(df.to_csv(sep="\t"))


def print_web_search_daily(df: pd.DataFrame, min_date=None, max_date=None) -> None:
    """@jiran.com 사용자의 web_search 사용 일별 통계를 출력한다."""
    jiran = _filter_jiran(df)
    msgs = jiran[jiran["event"] == "message_sent"].copy()

    def has_web_search(val):
        if isinstance(val, list):
            return "web_search" in val
        return False

    msgs = msgs[msgs["tools_used"].apply(has_web_search)]
    msgs["date"] = msgs["timestamp"].dt.date

    daily = (
        msgs
        .groupby("date")
        .agg(
            건수=("event", "size"),
            사용자수=("distinct_id", "nunique"),
        )
    )
    daily = _fill_missing_dates(daily, min_date, max_date)
    daily.loc["합계"] = daily.sum()

    print("\n[Daily 웹 Request 횟수 (@jiran.com)]")
    _print_tsv(daily)


def print_email_daily(df: pd.DataFrame, min_date=None, max_date=None) -> None:
    """@jiran.com 사용자의 email 사용 일별 통계를 출력한다."""
    jiran = _filter_jiran(df)
    msgs = jiran[jiran["event"] == "message_sent"].copy()

    def has_email(val):
        if isinstance(val, list):
            return "email" in val
        return False

    msgs = msgs[msgs["tools_used"].apply(has_email)]
    msgs["date"] = msgs["timestamp"].dt.date

    daily = (
        msgs
        .groupby("date")
        .agg(
            건수=("event", "size"),
            사용자수=("distinct_id", "nunique"),
        )
    )
    daily = _fill_missing_dates(daily, min_date, max_date)
    daily.loc["합계"] = daily.sum()

    print("\n[Daily 이메일 Request 횟수 (@jiran.com)]")
    _print_tsv(daily)


def print_attachment_messages_daily(df: pd.DataFrame, min_date=None, max_date=None) -> None:
    """첨부파일 포함 채팅 세션의 message_sent 일별 통계를 출력한다."""
    jiran = _filter_jiran(df)

    # chat_started에서 has_attachments=True인 session_id 수집
    chats = jiran[jiran["event"] == "chat_started"]
    attach_sessions = set(
        chats.loc[chats["has_attachments"] == True, "session_id"]
    )

    # 해당 session_id의 message_sent 필터
    msgs = jiran[jiran["event"] == "message_sent"].copy()
    msgs = msgs[msgs["session_id"].isin(attach_sessions)]
    msgs["date"] = msgs["timestamp"].dt.date

    daily = (
        msgs
        .groupby("date")
        .agg(
            메시지수=("event", "size"),
            세션수=("session_id", "nunique"),
            사용자수=("distinct_id", "nunique"),
        )
    )
    daily = _fill_missing_dates(daily, min_date, max_date)
    daily.loc["합계"] = daily.sum()

    print(f"\n[Daily 문서 Request 횟수 (@jiran.com)]")
    print(f"대상 세션 수: {len(attach_sessions)}")
    print()
    _print_tsv(daily)


def print_agent_messages_daily(df: pd.DataFrame, min_date=None, max_date=None) -> None:
    """에이전트 지정 채팅 세션의 message_sent 일별 통계를 출력한다."""
    jiran = _filter_jiran(df)

    # chat_started에서 agent_id가 존재하는 session_id 수집
    chats = jiran[jiran["event"] == "chat_started"]
    agent_sessions = set(
        chats.loc[chats["agent_id"].notna(), "session_id"]
    )

    # 해당 session_id의 message_sent 필터
    msgs = jiran[jiran["event"] == "message_sent"].copy()
    msgs = msgs[msgs["session_id"].isin(agent_sessions)]
    msgs["date"] = msgs["timestamp"].dt.date

    daily = (
        msgs
        .groupby("date")
        .agg(
            메시지수=("event", "size"),
            세션수=("session_id", "nunique"),
            사용자수=("distinct_id", "nunique"),
        )
    )
    daily = _fill_missing_dates(daily, min_date, max_date)
    daily.loc["합계"] = daily.sum()

    print("\n[Daily 에이전트 Request 횟수 (@jiran.com)]")
    print(f"대상 세션 수: {len(agent_sessions)}")
    print()
    _print_tsv(daily)


def print_plain_messages_daily(df: pd.DataFrame, min_date=None, max_date=None) -> None:
    """웹/이메일/문서/에이전트를 모두 사용하지 않는 일반 채팅 메시지 일별 통계를 출력한다."""
    jiran = _filter_jiran(df)
    chats = jiran[jiran["event"] == "chat_started"]

    # 첨부파일 세션, 에이전트 세션 수집
    attach_sessions = set(chats.loc[chats["has_attachments"] == True, "session_id"])
    agent_sessions = set(chats.loc[chats["agent_id"].notna(), "session_id"])

    msgs = jiran[jiran["event"] == "message_sent"].copy()

    # tools_used에 web_search/email 없는 것만
    def no_special_tools(val):
        if isinstance(val, list):
            return "web_search" not in val and "email" not in val
        return True

    msgs = msgs[msgs["tools_used"].apply(no_special_tools)]
    # 첨부파일/에이전트 세션 제외
    msgs = msgs[~msgs["session_id"].isin(attach_sessions)]
    msgs = msgs[~msgs["session_id"].isin(agent_sessions)]

    msgs["date"] = msgs["timestamp"].dt.date
    daily = msgs.groupby("date").agg(건수=("event", "size"), 사용자수=("distinct_id", "nunique"))
    daily = _fill_missing_dates(daily, min_date, max_date)
    daily.loc["합계"] = daily.sum()

    print("\n[Daily 일반 채팅 Request 횟수 (@jiran.com) - 웹/이메일/문서/에이전트 미사용]")
    _print_tsv(daily)


def print_category_summary(df: pd.DataFrame, min_date=None, max_date=None) -> None:
    """5개 카테고리(웹/이메일/문서/에이전트/일반)를 하나의 테이블로 합쳐 일별 통계를 출력한다."""
    jiran = _filter_jiran(df)
    chats = jiran[jiran["event"] == "chat_started"]
    msgs = jiran[jiran["event"] == "message_sent"].copy()
    msgs["date"] = msgs["timestamp"].dt.date

    # 세션 기반 분류용 집합
    attach_sessions = set(chats.loc[chats["has_attachments"] == True, "session_id"])
    agent_sessions = set(chats.loc[chats["agent_id"].notna(), "session_id"])

    # 각 메시지에 카테고리 부여 (우선순위: 웹 > 이메일 > 문서 > 에이전트 > 일반)
    def classify(row):
        tools = row.get("tools_used")
        if isinstance(tools, list):
            if "web_search" in tools:
                return "웹"
            if "email" in tools:
                return "이메일"
        sid = row.get("session_id")
        if sid in attach_sessions:
            return "문서"
        if sid in agent_sessions:
            return "에이전트"
        return "일반"

    msgs["category"] = msgs.apply(classify, axis=1)

    categories = ["웹", "이메일", "문서", "에이전트", "일반"]
    all_dates = pd.date_range(start=min_date, end=max_date, freq="D").date

    rows = []
    for d in all_dates:
        day_msgs = msgs[msgs["date"] == d]
        row = {"date": d}
        total_count = 0
        all_users = set()
        for cat in categories:
            cat_msgs = day_msgs[day_msgs["category"] == cat]
            cnt = len(cat_msgs)
            users = set(cat_msgs["distinct_id"].dropna())
            row[f"{cat}횟수"] = cnt
            row[f"{cat}사용자"] = len(users)
            total_count += cnt
            all_users |= users
        row["전체횟수"] = total_count
        sum_cat_users = sum(row[f"{cat}사용자"] for cat in categories)
        row["전체사용자"] = f"{sum_cat_users}({len(all_users)})"
        rows.append(row)

    result = pd.DataFrame(rows).set_index("date")

    # 합계 행 — 전체사용자가 문자열이므로 숫자 컬럼만 합산
    num_cols = [c for c in result.columns if c != "전체사용자"]
    sum_row = result[num_cols].apply(pd.to_numeric, errors="coerce").sum()
    for col in num_cols:
        result.loc["합계", col] = int(sum_row[col])
    grand_total = int(sum_row["전체횟수"])
    # 합계 행의 전체사용자도 합(고유) 형식
    total_sum_cat_users = sum(int(sum_row[f"{cat}사용자"]) for cat in categories)
    all_unique = set()
    for d in all_dates:
        day_msgs = msgs[msgs["date"] == d]
        all_unique |= set(day_msgs["distinct_id"].dropna())
    result.loc["합계", "전체사용자"] = f"{total_sum_cat_users}({len(all_unique)})"

    # 비율 행
    ratios = {}
    for col in result.columns:
        if col.endswith("횟수"):
            val = int(float(result.loc["합계", col]))
            pct = val / grand_total * 100 if grand_total else 0
            ratios[col] = f"{pct:.1f}%"
        else:
            ratios[col] = ""
    ratios["전체횟수"] = "100%"
    result = result.astype(str)
    result.loc["비율"] = ratios

    print("\n[카테고리별 통합 통계 (@jiran.com)]")
    print(result.to_csv())


def print_avg_messages_per_session(df: pd.DataFrame, min_date=None, max_date=None) -> None:
    """세션당 평균 message_sent 횟수를 일별로 출력한다."""
    jiran = _filter_jiran(df)
    msgs = jiran[jiran["event"] == "message_sent"].copy()
    msgs["date"] = msgs["timestamp"].dt.date

    per_session = (
        msgs
        .groupby(["date", "session_id"])
        .size()
        .reset_index(name="msg_count")
    )

    daily = (
        per_session
        .groupby("date")
        .agg(
            세션수=("session_id", "nunique"),
            메시지수=("msg_count", "sum"),
            세션당평균=("msg_count", "mean"),
            최소=("msg_count", "min"),
            최대=("msg_count", "max"),
        )
    )
    daily["세션당평균"] = daily["세션당평균"].round(1)
    daily = _fill_missing_dates(daily, min_date, max_date)

    total_sessions = daily["세션수"].sum()
    total_messages = daily["메시지수"].sum()
    overall_avg = total_messages / total_sessions if total_sessions else 0

    totals = pd.DataFrame([{
        "세션수": total_sessions,
        "메시지수": total_messages,
        "세션당평균": round(overall_avg, 1),
        "최소": "-",
        "최대": "-",
    }], index=["합계"])
    daily = daily.astype({"최소": str, "최대": str})
    daily = pd.concat([daily, totals])

    print("\n[Daily OfficeAgent 평균 멀티턴 대화 길이 (@jiran.com)]")
    print(f"전체 평균: {overall_avg:.1f}  (총 {int(total_sessions)}세션 / {int(total_messages)}메시지)")
    print()
    _print_tsv(daily)


def print_feedback_daily(df: pd.DataFrame, min_date=None, max_date=None) -> None:
    """feedback_submitted 이벤트 일별 통계를 출력한다."""
    jiran = _filter_jiran(df)
    fb = jiran[jiran["event"] == "feedback_submitted"].copy()

    if fb.empty:
        print("\n[평균 좋아요 갯수 와 싫어요 갯수 (@jiran.com)]")
        print("해당 이벤트가 없습니다.")
        return

    fb["date"] = fb["timestamp"].dt.date

    daily = (
        fb
        .groupby("date")
        .agg(
            건수=("event", "size"),
            사용자수=("distinct_id", "nunique"),
        )
    )
    daily = _fill_missing_dates(daily, min_date, max_date)
    daily.loc["합계"] = daily.sum()

    print("\n[평균 좋아요 갯수 와 싫어요 갯수 (@jiran.com)]")
    _print_tsv(daily)


def print_message_sent_daily(df: pd.DataFrame, min_date=None, max_date=None) -> None:
    """message_sent 이벤트 일별 통계를 출력한다."""
    jiran = _filter_jiran(df)
    msgs = jiran[jiran["event"] == "message_sent"].copy()
    msgs["date"] = msgs["timestamp"].dt.date

    daily = (
        msgs
        .groupby("date")
        .agg(
            건수=("event", "size"),
            사용자수=("distinct_id", "nunique"),
        )
    )
    daily = _fill_missing_dates(daily, min_date, max_date)
    daily.loc["합계"] = daily.sum()

    print("\n[Daily OfficeAgent 메시지 채팅 횟수 (@jiran.com)]")
    _print_tsv(daily)


def _analyze_subset(subset: pd.DataFrame, min_date, max_date) -> dict:
    """임의의 DataFrame 서브셋에 대해 전체 분석을 수행하여 dict로 반환한다."""
    chats = subset[subset["event"] == "chat_started"]
    msgs = subset[subset["event"] == "message_sent"].copy()
    msgs["date"] = msgs["timestamp"].dt.date

    attach_sessions = set(
        chats.loc[chats["has_attachments"] == True, "session_id"]
    ) if "has_attachments" in chats.columns and not chats.empty else set()
    agent_sessions = set(
        chats.loc[chats["agent_id"].notna(), "session_id"]
    ) if "agent_id" in chats.columns and not chats.empty else set()

    def classify(row):
        tools = row.get("tools_used")
        if isinstance(tools, list):
            if "web_search" in tools:
                return "웹"
            if "email" in tools:
                return "이메일"
        sid = row.get("session_id")
        if sid in attach_sessions:
            return "문서"
        if sid in agent_sessions:
            return "에이전트"
        return "일반"

    categories = ["웹", "이메일", "문서", "에이전트", "일반"]
    all_dates = pd.date_range(start=min_date, end=max_date, freq="D").date

    if not msgs.empty:
        msgs["category"] = msgs.apply(classify, axis=1)

    # --- 카테고리별 통합 ---
    cat_rows = []
    for d in all_dates:
        day_msgs = msgs[msgs["date"] == d] if not msgs.empty else msgs
        row = {"date": str(d)}
        total_count = 0
        all_users = set()
        for cat in categories:
            cat_msgs = day_msgs[day_msgs["category"] == cat] if not msgs.empty else day_msgs
            cnt = len(cat_msgs)
            users = set(cat_msgs["distinct_id"].dropna()) if cnt > 0 else set()
            row[cat] = {"count": cnt, "users": len(users)}
            total_count += cnt
            all_users |= users
        row["total"] = {"count": total_count, "users": len(all_users)}
        cat_rows.append(row)

    # --- 일별 메시지 ---
    msg_daily_rows = []
    for d in all_dates:
        day = msgs[msgs["date"] == d] if not msgs.empty else msgs
        msg_daily_rows.append({
            "date": str(d),
            "count": len(day),
            "users": int(day["distinct_id"].nunique()) if not day.empty else 0,
        })

    # --- 세션당 평균 멀티턴 ---
    avg_rows = []
    if not msgs.empty:
        per_session = (
            msgs.groupby(["date", "session_id"]).size()
            .reset_index(name="msg_count")
        )
        for d in all_dates:
            ds = per_session[per_session["date"] == d]
            avg_rows.append({
                "date": str(d),
                "sessions": int(ds["session_id"].nunique()) if not ds.empty else 0,
                "messages": int(ds["msg_count"].sum()) if not ds.empty else 0,
                "avg": round(float(ds["msg_count"].mean()), 1) if not ds.empty else 0,
            })
    else:
        for d in all_dates:
            avg_rows.append({"date": str(d), "sessions": 0, "messages": 0, "avg": 0})

    # --- 웹 검색 일별 ---
    def has_web_search(val):
        return isinstance(val, list) and "web_search" in val

    web_msgs = msgs[msgs["tools_used"].apply(has_web_search)] if not msgs.empty else msgs
    web_rows = []
    for d in all_dates:
        day = web_msgs[web_msgs["date"] == d] if not web_msgs.empty else web_msgs
        web_rows.append({
            "date": str(d),
            "count": len(day),
            "users": int(day["distinct_id"].nunique()) if not day.empty else 0,
        })

    # --- 이메일 일별 ---
    def has_email(val):
        return isinstance(val, list) and "email" in val

    email_msgs = msgs[msgs["tools_used"].apply(has_email)] if not msgs.empty else msgs
    email_rows = []
    for d in all_dates:
        day = email_msgs[email_msgs["date"] == d] if not email_msgs.empty else email_msgs
        email_rows.append({
            "date": str(d),
            "count": len(day),
            "users": int(day["distinct_id"].nunique()) if not day.empty else 0,
        })

    # --- 첨부파일(문서) 일별 ---
    attach_msg = msgs[msgs["session_id"].isin(attach_sessions)] if not msgs.empty else msgs
    attach_rows = []
    for d in all_dates:
        day = attach_msg[attach_msg["date"] == d] if not attach_msg.empty else attach_msg
        attach_rows.append({
            "date": str(d),
            "messages": len(day),
            "sessions": int(day["session_id"].nunique()) if not day.empty else 0,
            "users": int(day["distinct_id"].nunique()) if not day.empty else 0,
        })

    # --- 에이전트 일별 ---
    agent_msg = msgs[msgs["session_id"].isin(agent_sessions)] if not msgs.empty else msgs
    agent_rows = []
    for d in all_dates:
        day = agent_msg[agent_msg["date"] == d] if not agent_msg.empty else agent_msg
        agent_rows.append({
            "date": str(d),
            "messages": len(day),
            "sessions": int(day["session_id"].nunique()) if not day.empty else 0,
            "users": int(day["distinct_id"].nunique()) if not day.empty else 0,
        })

    # --- 일반 채팅 일별 ---
    def no_special_tools(val):
        if isinstance(val, list):
            return "web_search" not in val and "email" not in val
        return True

    if not msgs.empty:
        plain_msgs = msgs[msgs["tools_used"].apply(no_special_tools)]
        plain_msgs = plain_msgs[~plain_msgs["session_id"].isin(attach_sessions)]
        plain_msgs = plain_msgs[~plain_msgs["session_id"].isin(agent_sessions)]
    else:
        plain_msgs = msgs
    plain_rows = []
    for d in all_dates:
        day = plain_msgs[plain_msgs["date"] == d] if not plain_msgs.empty else plain_msgs
        plain_rows.append({
            "date": str(d),
            "count": len(day),
            "users": int(day["distinct_id"].nunique()) if not day.empty else 0,
        })

    # --- 피드백 ---
    fb = subset[subset["event"] == "feedback_submitted"].copy()
    fb_rows = []
    if not fb.empty:
        fb["date"] = fb["timestamp"].dt.date
        for d in all_dates:
            day_fb = fb[fb["date"] == d]
            fb_rows.append({
                "date": str(d),
                "count": len(day_fb),
                "users": int(day_fb["distinct_id"].nunique()),
            })

    return {
        "category_summary": cat_rows,
        "message_daily": msg_daily_rows,
        "avg_multiturn": avg_rows,
        "web_search_daily": web_rows,
        "email_daily": email_rows,
        "attachment_daily": attach_rows,
        "agent_daily": agent_rows,
        "plain_daily": plain_rows,
        "feedback": fb_rows,
    }


def _build_report_data(df: pd.DataFrame, min_date, max_date) -> dict:
    """@jiran.com 사용자의 전체 분석 결과를 dict로 반환한다."""
    jiran = _filter_jiran(df)
    result = _analyze_subset(jiran, min_date, max_date)
    result["period"] = {"from": str(min_date), "to": str(max_date)}
    return result


def _build_external_report_data(df: pd.DataFrame, min_date, max_date) -> list:
    """외부 도메인 사용자 데이터를 도메인별로 분석하여 리스트로 반환한다."""
    ext = _filter_external(df)
    if ext.empty:
        return []

    domains = sorted(ext["_domain"].unique())
    result = []
    for domain in domains:
        domain_df = ext[ext["_domain"] == domain]
        users = sorted(domain_df["distinct_id"].unique().tolist())

        analysis = _analyze_subset(domain_df, min_date, max_date)
        analysis["domain"] = domain
        analysis["users"] = users
        analysis["total_users"] = len(users)
        result.append(analysis)

    result.sort(key=lambda x: sum(r["total"]["count"] for r in x["category_summary"]), reverse=True)
    return result


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Mixpanel 이벤트 데이터 분석 CLI",
    )
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("basic", help="기본 통계 요약")
    sub.add_parser("messages", help="세션별 메시지 발송 분석")
    sub.add_parser("daily", help="일별 이벤트 집계")
    sub.add_parser("web-search", help="web_search 사용 일별 통계 (@jiran.com)")
    sub.add_parser("email", help="email 사용 일별 통계 (@jiran.com)")
    sub.add_parser("attach-msg", help="첨부파일 채팅 세션의 message_sent 통계 (@jiran.com)")
    sub.add_parser("agent-msg", help="에이전트 지정 채팅 세션의 message_sent 통계 (@jiran.com)")
    sub.add_parser("avg-msg", help="세션당 평균 message_sent (@jiran.com)")
    sub.add_parser("feedback", help="feedback_submitted 일별 통계 (@jiran.com)")
    sub.add_parser("msg-count", help="message_sent 일별 횟수 (@jiran.com)")
    sub.add_parser("plain-msg", help="일반 채팅 일별 통계 - 웹/이메일/문서/에이전트 미사용 (@jiran.com)")
    sub.add_parser("category", help="카테고리별 통합 통계 (@jiran.com)")
    sub.add_parser("all", help="모든 분석 실행")
    sub.add_parser("report", help="전체 분석 결과를 JSON으로 출력 (@jiran.com)")
    sub.add_parser("external-report", help="외부 도메인 분석 결과를 JSON으로 출력")

    return parser


COMMANDS = {
    "basic": print_basic_stats,
    "msg-count": print_message_sent_daily,
    "avg-msg": print_avg_messages_per_session,
    "feedback": print_feedback_daily,
    "web-search": print_web_search_daily,
    "email": print_email_daily,
    "attach-msg": print_attachment_messages_daily,
    "agent-msg": print_agent_messages_daily,
    "plain-msg": print_plain_messages_daily,
    "category": print_category_summary,
}

def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    df = load_mixpanel_data(DATA_FILE)
    min_date = df["timestamp"].dt.date.min()
    max_date = df["timestamp"].dt.date.max()

    if args.command == "report":
        report = _build_report_data(df, min_date, max_date)
        print(json.dumps(report, ensure_ascii=False, indent=2))
    elif args.command == "external-report":
        ext = _build_external_report_data(df, min_date, max_date)
        report = {
            "period": {"from": str(min_date), "to": str(max_date)},
            "domains": ext,
        }
        print(json.dumps(report, ensure_ascii=False, indent=2))
    elif args.command == "all":
        for name, fn in COMMANDS.items():
            if name == "basic":
                continue
            fn(df, min_date, max_date)
    elif args.command == "basic":
        COMMANDS[args.command](df)
    else:
        COMMANDS[args.command](df, min_date, max_date)


if __name__ == "__main__":
    main()
