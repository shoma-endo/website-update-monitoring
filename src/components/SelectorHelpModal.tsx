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
              { step: 1, text: <>監視したい場所を右クリックし、「<strong className="text-[var(--brand-blue)]">検証</strong>」を選択します。</> },
              { step: 2, text: <>ハイライトされた要素の「<strong className="text-[var(--brand-blue)]">タグ名</strong>（h1, article等）」や「<strong className="text-[var(--brand-blue)]">クラス名</strong>（.news-title等）」を使えないか確認します。</> },
              { step: 3, text: <>特定の要素が見つけにくい場合は、右クリックして「<strong className="text-[var(--brand-blue)]">Copy</strong>」→「<strong className="text-[var(--brand-blue)]">Copy selector</strong>」を選択します。</> },
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

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-5 rounded-2xl">
            <h3 className="text-amber-600 dark:text-amber-500 font-bold mb-3 flex items-center gap-2">
              <span className="text-xl">⚠️</span> 注意: Copy selector について
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
              ブラウザからコピーした長いパス（例: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">div:nth-child(2) &gt; ...</code>）は、サイトの構造が少し変わるだけで<strong>すぐに監視が止まる（エラーになる）</strong>原因となります。
            </p>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-disc list-inside">
              <li>可能な限り、<strong className="text-[var(--text-primary)]">タグ名（article, h1等）</strong>や<strong className="text-[var(--text-primary)]">固有のクラス名</strong>を優先してください。</li>
              <li>「Attribute selector didn&apos;t terminate」というエラーが出たら、セレクタ内の <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">[...]</code> を消すか、別の指定方法を試してください。</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)] font-mono text-[10px] text-[var(--text-secondary)]">
               <span className="text-[var(--text-primary)] font-bold">安定した指定の例:</span><br/>
               article h3 , .news-list , h1
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
