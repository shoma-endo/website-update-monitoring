'use client';

import { Trash2, Link as LinkIcon, Activity } from 'lucide-react';

export interface DiscoveryRule {
  record_id: string;
  fields: {
    Label?: string;
    SourceURL: string;
    LinkSelector: string;
    URLPattern: string;
    TargetSelector: string;
    IsActive: boolean;
  };
}

interface DiscoveryListProps {
  rules: DiscoveryRule[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function DiscoveryList({ rules, isLoading, onRefresh }: DiscoveryListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('この自動追加設定を削除しますか？ (監視済みのURLは削除されません)')) return;
    try {
      const res = await fetch(`/api/discovery/${id}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
      else alert('削除に失敗しました。');
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="space-y-4 animate-pulse">{[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}</div>;
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <p className="text-[var(--text-secondary)] text-sm">自動追加設定がありません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <div key={rule.record_id} className="p-5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-sm group relative">
          <div className="absolute top-4 right-4">
            <button 
              onClick={() => handleDelete(rule.record_id)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg ${rule.fields.IsActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
              <Activity size={16} />
            </div>
            <h4 className="font-bold text-[var(--text-primary)]">{rule.fields.Label || '無題のルール'}</h4>
            {!rule.fields.IsActive && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">停止中</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5 truncate">
              <LinkIcon size={12} className="shrink-0" />
              <span className="truncate">{rule.fields.SourceURL}</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="font-semibold shrink-0">Pattern:</span>
              <code className="bg-slate-100 dark:bg-black/20 px-1.5 py-0.5 rounded truncate font-mono">{rule.fields.URLPattern}</code>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold shrink-0">Target:</span>
              <code className="bg-slate-100 dark:bg-black/20 px-1.5 py-0.5 rounded truncate font-mono">{rule.fields.TargetSelector}</code>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
