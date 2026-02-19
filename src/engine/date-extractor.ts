import { format, isValid, getYear } from 'date-fns';

export interface ExtractedDates {
  startDate: string | null;
  endDate: string | null;
}

/**
 * 日本語のテキストから開始日と終了日を抽出する
 * 形式: "2026年3月3日(火) 00:00 - 3月9日(月) 23:59" や "3/7(金)～3/10(月)" など
 */
export function extractDatesFromText(text: string): ExtractedDates {
  const currentYear = getYear(new Date());
  
  // 1. 日付パターンを探す
  // 形式: 2026/03/01, 2026年3月1日, 3/1, 3月1日
  const datePattern = /(?:(\d{4})[年/])?\s*(\d{1,2})[月/](\d{1,2})日?/g;
  const matches = Array.from(text.matchAll(datePattern));

  if (matches.length === 0) {
    return { startDate: null, endDate: null };
  }

  const results: string[] = [];

  for (const match of matches) {
    const yearStr = match[1] || String(currentYear);
    const monthStr = match[2];
    const dayStr = match[3];

    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const day = parseInt(dayStr);

    // 月と日の妥当性チェック
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;

    const date = new Date(year, month - 1, day);
    if (isValid(date) && getYear(date) === year) {
      results.push(format(date, 'yyyy-MM-dd'));
    }
  }

  // 重複を削除してソート（基本的には最初に出てくる日付が開始日、次が終了日と仮定）
  const uniqueDates = Array.from(new Set(results)).sort();

  return {
    startDate: uniqueDates[0] || null,
    endDate: uniqueDates.length > 1 ? uniqueDates[uniqueDates.length - 1] : uniqueDates[0] || null,
  };
}

/**
 * HTML全体から特定のアプローチで日付を抽出する
 */
export function extractDatesFromHtml(html: string): ExtractedDates {
  // Amazonのセールページでよく見られるキーワード周辺を探す
  const keywords = ['開催期間', 'セール期間', '実施期間', '期間：', 'キャンペーン期間'];
  
  for (const keyword of keywords) {
    const index = html.indexOf(keyword);
    if (index !== -1) {
      // キーワードの後の100文字程度を抽出して解析
      const snippet = html.substring(index, index + 150);
      const dates = extractDatesFromText(snippet);
      if (dates.startDate) return dates;
    }
  }

  // 見つからない場合は全体から探すが、精度は落ちる可能性がある
  return extractDatesFromText(html);
}
