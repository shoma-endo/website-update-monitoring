'use client';

import { useState, useMemo } from 'react';
import { Pencil, Trash2, ExternalLink, Bell, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import EditMonitorModal from './EditMonitorModal';

export interface Monitor {
  record_id: string;
  fields: {
    Label?: string;
    URL: string;
    Selector?: string;
    LastChecked?: number | string;
    LastHash?: string;
    Status?: string;
    ErrorMessage?: string;
  };
}

interface MonitorListProps {
  monitors: Monitor[];
  isLoading: boolean;
  onRefresh: () => void;
}

// クライアントサイドでのみ日付をレンダリングするコンポーネント
function FormattedDate({ timestamp }: { timestamp: string | number | null | undefined }) {
  const dateString = useMemo(() => {
    if (!timestamp) return '---';
    try {
      const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
      return format(date, 'yyyy/MM/dd HH:mm:ss', { locale: ja });
    } catch {
      return '---';
    }
  }, [timestamp]);

  return <>{dateString}</>;
}

export default function MonitorList({ monitors, isLoading, onRefresh }: MonitorListProps) {
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isNotifying, setIsNotifying] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('本当にこの監視設定を削除しますか？')) return;

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/monitors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      } else {
        alert('削除に失敗しました。');
      }
    } catch (e) {
      console.error(e);
      alert('エラーが発生しました。');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleTestNotify = async (id: string) => {
    setIsNotifying(id);
    try {
      const res = await fetch(`/api/monitors/${id}/test-notify`, { method: 'POST' });
      if (res.ok) {
        alert('テスト通知を送信しました。Larkを確認してください。');
      } else {
        const data = await res.json();
        alert(`送信失敗: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('エラーが発生しました。');
    } finally {
      setIsNotifying(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-800 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (monitors.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
        <p className="text-slate-400">監視対象が登録されていません。</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {monitors
          .filter(m => m.fields.URL)
          .map((m) => {
            const isError = m.fields.Status === 'Error';
            return (
              <div 
                key={m.record_id} 
                className={`group relative p-6 rounded-2xl border transition-all flex flex-col hover:shadow-lg hover:border-[var(--brand-blue)]/30 ${
                  isError 
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' 
                    : 'bg-[var(--card-bg)] border-[var(--border-color)] shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                }`}
              >
            
            {/* Action Buttons */}
            <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 transition-opacity">
              <button 
                onClick={() => handleTestNotify(m.record_id)}
                disabled={isNotifying === m.record_id}
                className="p-2.5 bg-[var(--background)] hover:bg-amber-50 dark:hover:bg-amber-950/30 text-[var(--text-secondary)] hover:text-amber-600 rounded-xl transition-all disabled:opacity-50"
                title="テスト通知を送信"
              >
                <Bell size={16} className={isNotifying === m.record_id ? 'animate-pulse' : ''} />
              </button>
              <button 
                onClick={() => setEditingMonitor(m)}
                className="p-2.5 bg-[var(--background)] hover:bg-blue-50 dark:hover:bg-blue-950/30 text-[var(--text-secondary)] hover:text-[var(--brand-blue)] rounded-xl transition-all"
                title="編集"
              >
                <Pencil size={16} />
              </button>
              <button 
                onClick={() => handleDelete(m.record_id)}
                disabled={isDeleting === m.record_id}
                className="p-2.5 bg-[var(--background)] hover:bg-red-50 dark:hover:bg-red-950/30 text-[var(--text-secondary)] hover:text-red-600 rounded-xl transition-all disabled:opacity-50"
                title="削除"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mb-4 pr-12">
              <div className="flex items-center gap-2 mb-1 text-[10px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                <span className="bg-[var(--background)] px-2 py-0.5 rounded-md">ID: {m.record_id.slice(-6)}</span>
                {isError && <span className="text-red-500 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-md">ERROR</span>}
              </div>
              <h3 className="font-bold text-lg text-[var(--text-primary)] leading-tight line-clamp-1" title={m.fields.Label}>
                {m.fields.Label || '無題のモニタリング'}
              </h3>
            </div>
            
            <a 
              href={m.fields.URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-medium text-[var(--brand-blue)] hover:text-[var(--brand-blue-hover)] break-all mb-6 flex items-center gap-1.5 group/link"
            >
              <ExternalLink size={14} className="shrink-0 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              <span className="truncate underline-offset-4 group-hover:underline">{m.fields.URL}</span>
            </a>

            {/* Error Message */}
            {isError && m.fields.ErrorMessage && (
              <div className="mb-6 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-sm bg-[var(--card-bg)] p-3 rounded-xl border border-red-100 dark:border-red-900 shadow-sm">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span className="break-words leading-relaxed">{m.fields.ErrorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs border-t border-[var(--background)] pt-4 mt-auto">
              <div className="flex items-center gap-2">
                <div className={`relative flex h-2 w-2`}>
                  {!isError && m.fields.LastChecked && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${m.fields.LastChecked ? (isError ? 'bg-red-500' : 'bg-green-500') : 'bg-[var(--border-color)]'}`}></span>
                </div>
                <span className="text-[var(--text-secondary)] font-medium">
                  {isError ? '最終エラー:' : '最終チェック:'}
                </span>
              </div>
              <span className="font-semibold text-[var(--text-secondary)]">
                <FormattedDate timestamp={m.fields.LastChecked} />
              </span>
            </div>
          </div>
            );
          })}
      </div>

      {editingMonitor && (
        <EditMonitorModal 
          monitor={editingMonitor} 
          isOpen={!!editingMonitor} 
          onClose={() => setEditingMonitor(null)}
          onSuccess={() => {
            onRefresh();
            setEditingMonitor(null);
          }}
        />
      )}
    </>
  );
}
