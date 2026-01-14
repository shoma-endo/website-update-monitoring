'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface SelectorHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SelectorHelpModal({ isOpen, onClose }: SelectorHelpModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-xl shadow-[0_32px_80px_rgba(0,0,0,0.16)] border border-[var(--border-color)] animation-fade-in relative overflow-hidden text-[var(--foreground)]">
        <div className="p-8 border-b border-[var(--background)] flex justify-between items-center bg-[var(--background)]/30">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">CSSセレクタの取得方法</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              ブラウザの標準機能を使って、正確に指定できます。
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--border-color)] rounded-xl transition-colors text-[var(--text-secondary)]">
            ✕
          </button>
        </div>
        
        <div className="p-8 space-y-8 text-[var(--text-primary)]">
          <div className="grid gap-6">
            {[
              { step: 1, text: <>監視したいテキスト（価格やニュース件名など）の上で<strong className="text-[var(--brand-blue)]">右クリック</strong>し、「<strong className="text-[var(--brand-blue)]">検証</strong>」を選択します。</> },
              { step: 2, text: <>開発者ツールが開きます。対象の HTML 行が青くハイライトされていることを確認してください。</> },
              { step: 3, text: <>ハイライトされた行でさらに<strong className="text-[var(--brand-blue)]">右クリック</strong>します。</> },
              { step: 4, text: <>メニューから「<strong className="text-[var(--brand-blue)]">Copy</strong>」→「<strong className="text-[var(--brand-blue)]">Copy selector</strong>」をクリックして完了です。</> },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--brand-blue-bg)] text-[var(--brand-blue)] flex items-center justify-center font-bold text-sm border border-[var(--brand-blue)]/10 shadow-sm">
                  {item.step}
                </span>
                <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl">
            <h3 className="text-[var(--brand-blue)] font-bold mb-3 flex items-center gap-2">
              <span className="text-xl">💡</span> 正確にモニタリングするコツ
            </h3>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-disc list-inside">
              <li><strong className="text-[var(--text-primary)]">変化する要素そのもの</strong>（テキスト部分）を指定するのが最も確実です。</li>
              <li>広すぎる範囲を指定すると、関係のない変更で通知が飛ぶことがあります。</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)] font-mono text-[10px] text-[var(--text-secondary)] break-all">
               貼り付け例:<br/>
               #content &gt; div.main &gt; ul &gt; li:nth-child(1) &gt; .price
            </div>
            <button 
              onClick={onClose}
              className="w-full sm:w-auto px-10 py-3 bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white rounded-xl font-bold shadow-lg shadow-blue-100 dark:shadow-none transition-all"
            >
              理解しました
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
