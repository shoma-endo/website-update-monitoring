'use client';

import { useState } from 'react';
import { Play, Loader2, Plus, Info, ChevronDown, ChevronRight, Settings2 } from 'lucide-react';

interface DiscoveryFormProps {
  onSuccess: () => void;
}

const PRESETS = [
  {
    domain: 'amazon.co.jp',
    name: 'Amazon',
    linkSelector: 'a[href^="/events/"]',
    urlPattern: '^https://www.amazon.co.jp/events/.+',
    targetSelector: 'span.a-size-extra-large'
  }
];

export default function DiscoveryForm({ onSuccess }: DiscoveryFormProps) {
  const [formData, setFormData] = useState({
    label: '',
    sourceUrl: '',
    linkSelector: '',
    urlPattern: '',
    targetSelector: '',
    isActive: true
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string[]>([]);
  const [appliedPreset, setAppliedPreset] = useState<typeof PRESETS[0] | null>(null);

  // URL入力時にプリセットを自動判別
  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, sourceUrl: url }));
    
    const preset = PRESETS.find(p => url.includes(p.domain));
    if (preset) {
      setFormData(prev => ({
        ...prev,
        sourceUrl: url,
        linkSelector: preset.linkSelector,
        urlPattern: preset.urlPattern,
        targetSelector: preset.targetSelector,
        label: prev.label || `${preset.name} セール発見`
      }));
      setAppliedPreset(preset);
    } else {
      setAppliedPreset(null);
    }
  };

  const handleTest = async () => {
    if (!formData.sourceUrl || !formData.linkSelector || !formData.urlPattern) {
      setError('テストを実行するには、巡回先URLと抽出設定が必要です（Amazonなどは自動入力されます）。');
      return;
    }
    
    setError(null);
    setTestStatus('loading');
    setTestResult([]);
    
    try {
      const res = await fetch('/api/debug/test-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        setTestStatus('success');
        setTestResult(data.urls || []);
      } else {
        setTestStatus('error');
        setError(data.error || '発見に失敗しました');
      }
    } catch {
      setTestStatus('error');
      setError('通信エラーが発生しました。');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.linkSelector || !formData.urlPattern || !formData.targetSelector) {
      setError('詳細設定が不足しています。対象のサイトに合わせたセレクタを入力してください。');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({
          label: '',
          sourceUrl: '',
          linkSelector: '',
          urlPattern: '',
          targetSelector: '',
          isActive: true
        });
        setTestStatus('idle');
        setAppliedPreset(null);
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
    <section className="bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)]">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Plus size={20} className="text-[var(--brand-blue)]" />
          URL自動追加設定の作成
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          特定のページから新しいURLを自動で見つけ、監視対象に追加するためのルールを作成します。
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-sm animate-fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold">ルール名</label>
            <input 
              type="text" 
              placeholder="例: Amazon セール発見"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
              value={formData.label}
              onChange={e => setFormData({...formData, label: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold">巡回先URL <span className="text-red-500">*</span></label>
            <div className="relative">
              <input 
                type="url" 
                placeholder="https://www.amazon.co.jp/events/"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
                value={formData.sourceUrl}
                onChange={e => handleUrlChange(e.target.value)}
              />
              {appliedPreset && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black border border-green-100 animate-in fade-in zoom-in duration-300">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  {appliedPreset.name} モード適用中
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <Settings2 size={14} className="group-hover:rotate-45 transition-transform duration-300" />
            {appliedPreset ? '抽出設定をカスタマイズする' : '詳細設定（セレクタ・パターン）'}
            {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-black/10 rounded-xl border border-[var(--border-color)] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">リンク抽出セレクタ</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
                    value={formData.linkSelector}
                    onChange={e => setFormData({...formData, linkSelector: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">URLパターン (Regex)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
                    value={formData.urlPattern}
                    onChange={e => setFormData({...formData, urlPattern: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold">登録後の監視セレクタ</label>
                <input 
                  type="text" 
                  placeholder="例: span.a-size-extra-large"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
                  value={formData.targetSelector}
                  onChange={e => setFormData({...formData, targetSelector: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleTest}
            disabled={testStatus === 'loading'}
            className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            {testStatus === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
            この設定で発見をテスト
          </button>
        </div>

        {testStatus === 'success' && testResult.length > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 rounded-xl text-xs animate-fade-in">
            <p className="font-bold mb-2 flex items-center gap-1">
              <Info size={14} />
              {testResult.length} 件のリンクが見つかりました:
            </p>
            <ul className="list-disc pl-4 space-y-1 max-h-24 overflow-y-auto font-mono">
              {testResult.map((url, i) => <li key={i} className="truncate">{url}</li>)}
            </ul>
          </div>
        )}

        <button 
          disabled={isSubmitting}
          className="w-full py-3 bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
        >
          {isSubmitting ? '登録中...' : '自動追加設定を保存'}
        </button>
      </form>
    </section>
  );
}
