'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Monitor } from './MonitorList';

interface EditMonitorModalProps {
  monitor: Monitor;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditMonitorModal({ monitor, isOpen, onClose, onSuccess }: EditMonitorModalProps) {
  const [formData, setFormData] = useState({
    label: monitor.fields.Label || '',
    url: monitor.fields.URL || '',
    selector: monitor.fields.Selector || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

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
      <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-lg shadow-[0_24px_64px_rgba(0,0,0,0.12)] border border-[var(--border-color)] overflow-hidden animation-fade-in">
        <div className="p-6 border-b border-[var(--background)] flex items-center justify-between text-center md:text-left bg-[var(--background)]/50">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">監視設定を編集</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--border-color)] rounded-lg transition-colors text-[var(--text-secondary)]">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-sm text-center md:text-left">
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
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--text-primary)]">CSS セレクタ</label>
            <input 
              className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-blue)]/20 focus:border-[var(--brand-blue)] focus:bg-[var(--card-bg)] outline-none transition-all"
              value={formData.selector}
              onChange={e => setFormData({...formData, selector: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-[var(--text-secondary)] bg-[var(--background)] hover:bg-[var(--border-color)] transition-all"
            >
              キャンセル
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] shadow-lg shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '変更を保存'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
