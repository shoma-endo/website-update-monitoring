'use client';

import { useState } from 'react';
import { HelpCircle, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import SelectorHelpModal from './SelectorHelpModal';

interface MonitorFormProps {
  onSuccess: () => void;
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

export default function MonitorForm({ onSuccess }: MonitorFormProps) {
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    selector: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // テスト抽出用のState
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testResult, setTestResult] = useState<string>('');

  const validate = () => {
    if (!formData.url.startsWith('http')) {
      return 'URL は http:// または https:// で開始してください。';
    }
    return null;
  };

  const handleTest = async () => {
    if (!formData.url || !formData.selector) {
      setError('テストを実行するには URL と CSS セレクタを入力してください。');
      return;
    }
    
    setError(null);
    setTestStatus('loading');
    setTestResult('');
    
    try {
      const res = await fetch('/api/test-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.url, selector: formData.selector })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTestStatus('success');
        setTestResult(data.content); // プレビューテキスト
      } else {
        setTestStatus('error');
        setTestResult(data.error || '不明なエラーが発生しました');
      }
    } catch {
      setTestStatus('error');
      setTestResult('通信エラーが発生しました。');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ label: '', url: '', selector: '' });
        setTestStatus('idle');
        setTestResult('');
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || '登録に失敗しました。');
      }
    } catch {
      setError('サーバー通信エラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl">
        <div className="mb-8 text-center md:text-left">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">新しいモニタリングを開始</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            監視したいサイトの情報を入力してください。
            <br className="hidden md:block" />Antigravity Watch が、あなたの代わりに更新をチェックします。
          </p>
        </div>
        
        {error && (
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2 animate-fade-in">
            <span className="font-bold shrink-0">!</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="label" className="block text-sm font-semibold text-[var(--text-primary)]">
              モニタリング名
            </label>
            <input 
              id="label"
              type="text"
              placeholder="例: 公式サイトのお知らせ更新" 
              value={formData.label}
              onChange={e => setFormData({...formData, label: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:ring-2 focus:ring-[var(--brand-blue)]/20 focus:border-[var(--brand-blue)] focus:bg-[var(--card-bg)] outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="url" className="block text-sm font-semibold text-[var(--text-primary)]">
              対象のURL <span className="text-red-500">*</span>
            </label>
            <input 
              id="url"
              type="url"
              placeholder="https://example.com/news" 
              required
              value={formData.url}
              onChange={e => setFormData({...formData, url: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:ring-2 focus:ring-[var(--brand-blue)]/20 focus:border-[var(--brand-blue)] focus:bg-[var(--card-bg)] outline-none transition-all"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1 ml-1">
              ※ 一般公開されている（ログイン不要な）ページのみ監視可能です。
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="selector" className="text-sm font-semibold text-[var(--text-primary)]">
                CSS セレクタ <span className="text-red-500">*</span>
              </label>
              <button 
                type="button" 
                onClick={() => setIsHelpOpen(true)}
                className="text-[var(--brand-blue)] hover:text-[var(--brand-blue-hover)] text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <HelpCircle size={14} />
                セレクタの取得方法
              </button>
            </div>
            <div className="flex gap-2">
              <input 
                id="selector"
                type="text"
                placeholder="例: .news-list, article" 
                required
                value={formData.selector}
                onChange={e => setFormData({...formData, selector: e.target.value})}
                className="flex-1 px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:ring-2 focus:ring-[var(--brand-blue)]/20 focus:border-[var(--brand-blue)] focus:bg-[var(--card-bg)] outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={!formData.url || !formData.selector || testStatus === 'loading'}
                className={`
                  px-4 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shrink-0
                  ${!formData.url || !formData.selector 
                    ? 'bg-[var(--background)] text-[var(--text-secondary)] border border-[var(--border-color)] cursor-not-allowed'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800'}
                `}
                title="入力したURLとセレクタで正しく取得できるかテストします"
              >
                {testStatus === 'loading' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                <span className="hidden sm:inline">テスト</span>
              </button>
            </div>
          </div>

          {/* テスト結果表示エリア */}
          {testStatus !== 'idle' && (
            <div className={`
              rounded-xl p-4 text-sm border animate-fade-in
              ${testStatus === 'success' 
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300' 
                : testStatus === 'error' 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'
                  : 'bg-[var(--background)] border-[var(--border-color)] text-[var(--text-secondary)]'}
            `}>
              <div className="flex items-center gap-2 mb-2 font-bold">
                {testStatus === 'success' && <CheckCircle size={16} />}
                {testStatus === 'error' && <AlertCircle size={16} />}
                {testStatus === 'loading' && <Loader2 size={16} className="animate-spin" />}
                <span>
                  {testStatus === 'success' ? '抽出成功' : testStatus === 'error' ? '抽出失敗' : 'テスト中...'}
                </span>
              </div>
              
              {testResult && (
                <div className="mt-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-black/5 dark:border-white/5 font-mono text-xs overflow-x-auto max-h-32 whitespace-pre-wrap break-all">
                  {testResult}
                </div>
              )}
            </div>
          )}

          <button 
            disabled={isSubmitting}
            className={`
              w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]
              ${isSubmitting 
                ? 'bg-[var(--text-secondary)] cursor-not-allowed shadow-none opacity-50' 
                : 'bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] hover:shadow-blue-300 dark:hover:shadow-none'}
            `}
          >
            {isSubmitting ? 'セットアップ中...' : 'モニタリングを開始する'}
          </button>
          
          <p className="text-[10px] text-[var(--text-secondary)] text-center leading-relaxed">
            ※ 登録後、ウェブサイトの更新を自動的に検知し、<br className="sm:hidden" />
            Larkボット経由で通知をお送りします。
          </p>
        </form>
      </section>

      <SelectorHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}