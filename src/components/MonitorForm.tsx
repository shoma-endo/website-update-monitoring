'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import SelectorHelpModal from './SelectorHelpModal';

interface MonitorFormProps {
  onSuccess: () => void;
}

export default function MonitorForm({ onSuccess }: MonitorFormProps) {
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    selector: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const validate = () => {
    if (!formData.url.startsWith('http')) {
      return 'URL は http:// または https:// で開始してください。';
    }
    return null;
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
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
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
            <input 
              id="selector"
              type="text"
              placeholder="例: .news-list, article" 
              required
              value={formData.selector}
              onChange={e => setFormData({...formData, selector: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:ring-2 focus:ring-[var(--brand-blue)]/20 focus:border-[var(--brand-blue)] focus:bg-[var(--card-bg)] outline-none transition-all"
            />
          </div>

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
