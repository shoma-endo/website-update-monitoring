/**
 * プロジェクト全体で使用する定数
 */

export const SCRAPING_TIMEOUT = 10000; // 10秒

export const DEFAULT_USER_AGENT = 
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';


// API レスポンスメッセージなど（必要に応じて追加）
export const ERROR_MESSAGES = {
  SELECTOR_NOT_FOUND: '指定されたセレクタが見つかりませんでした。',
  FETCH_FAILED: 'コンテンツの取得に失敗しました。',
  LARK_UPDATE_FAILED: 'Lark Base の更新に失敗しました。',
};
