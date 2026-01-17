'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Monitor } from './MonitorList';

interface EditMonitorModalProps {
  monitor: Monitor;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

export default function EditMonitorModal({ monitor, isOpen, onClose, onSuccess }: EditMonitorModalProps) {
  const [formData, setFormData] = useState({
    label: monitor.fields.Label || '',
    url: monitor.fields.URL || '',
    selector: monitor.fields.Selector || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // テスト抽出用のState
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // モーダルが開かれるたびにフォームとテスト状態をリセット
  useEffect(() => {
    if (isOpen) {
      setFormData({
        label: monitor.fields.Label || '',
        url: monitor.fields.URL || '',
        selector: monitor.fields.Selector || ''
      });
      setTestStatus('idle');
      setTestResult('');
      setError(null);
    }
  }, [isOpen, monitor]);

  if (!mounted || !isOpen) return null;

  const handleTest = async () => {
    if (!formData.url || !formData.selector) {
      setError('テストを実行するには URL と CSS セレクタを入力してください。');
      return;
    }
    
    // エラー表示をクリアし、ローディング状態へ
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
        setTestResult(data.content);
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
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/monitors/${monitor.record_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || '更新に失敗しました。');
      }
    } catch {
      setError('サーバー通信エラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-lg shadow-[0_24px_64px_rgba(0,0,0,0.12)] border border-[var(--border-color)] overflow-hidden animation-fade-in flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-[var(--background)] flex items-center justify-between text-center md:text-left bg-[var(--background)]/50 shrink-0">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">監視設定を編集</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--border-color)] rounded-lg transition-colors text-[var(--text-secondary)]">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-8 space-y-6">
          <form id="edit-monitor-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-sm text-center md:text-left animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">モニタリング名</label>
              <input 
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-blue)]/20 focus:border-[var(--brand-blue)] focus:bg-[var(--card-bg)] outline-none transition-all"
                value={formData.label}
                onChange={e => setFormData({...formData, label: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">URL</label>
              <input 
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-blue)]/20 focus:border-[var(--brand-blue)] focus:bg-[var(--card-bg)] outline-none transition-all"
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1 ml-1">
                ※ 一般公開されている（ログイン不要な）ページのみ監視可能です。
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">CSS セレクタ</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-blue)]/20 focus:border-[var(--brand-blue)] focus:bg-[var(--card-bg)] outline-none transition-all"
                  value={formData.selector}
                  onChange={e => setFormData({...formData, selector: e.target.value})}
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
          </form>
        </div>

        <div className="p-6 border-t border-[var(--background)] flex gap-4 bg-[var(--background)]/50 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-[var(--text-secondary)] bg-[var(--background)] hover:bg-[var(--border-color)] transition-all"
          >
            キャンセル
          </button>
          <button 
            type="submit" 
            form="edit-monitor-form"
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] shadow-lg shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}