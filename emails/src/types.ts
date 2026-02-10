export interface CategoryData {
  count: number;
  users: number;
}

export interface CategoryRow {
  date: string;
  웹: CategoryData;
  이메일: CategoryData;
  문서: CategoryData;
  에이전트: CategoryData;
  일반: CategoryData;
  total: CategoryData;
}

export interface DailyRow {
  date: string;
  count: number;
  users: number;
}

export interface AvgMultiturnRow {
  date: string;
  sessions: number;
  messages: number;
  avg: number;
}

export interface SessionDailyRow {
  date: string;
  messages: number;
  sessions: number;
  users: number;
}

export interface ReportData {
  period: { from: string; to: string };
  category_summary: CategoryRow[];
  message_daily: DailyRow[];
  avg_multiturn: AvgMultiturnRow[];
  web_search_daily: DailyRow[];
  email_daily: DailyRow[];
  attachment_daily: SessionDailyRow[];
  agent_daily: SessionDailyRow[];
  plain_daily: DailyRow[];
  feedback: DailyRow[];
}
