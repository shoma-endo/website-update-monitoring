'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Search, List } from 'lucide-react';
import Image from 'next/image';
import MonitorForm from '@/components/MonitorForm';
import MonitorList, { Monitor } from '@/components/MonitorList';
import DiscoveryForm from '@/components/DiscoveryForm';
import DiscoveryList, { DiscoveryRule } from '@/components/DiscoveryList';

export default function Home() {
  const [tab, setTab] = useState<'monitors' | 'discovery'>('monitors');
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [discoveryRules, setDiscoveryRules] = useState<DiscoveryRule[]>([]);
  const [baseInfo, setBaseInfo] = useState<{ name: string; app_token?: string } | null>(null);
  const [isLoadingMonitors, setIsLoadingMonitors] = useState(true);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchMonitors = async () => {
    setIsLoadingMonitors(true);
    try {
      const res = await fetch('/api/monitors');
      const data = await res.json();
      if (res.ok) {
        setMonitors(data.items || []);
        if (data.baseInfo) setBaseInfo(data.baseInfo);
      }
    } catch (e) {
      console.error('Failed to fetch monitors:', e);
    } finally {
      setIsLoadingMonitors(false);
    }
  };

  const fetchDiscoveryRules = async () => {
    setIsLoadingDiscovery(true);
    try {
      const res = await fetch('/api/discovery');
      const data = await res.json();
      if (res.ok) {
        setDiscoveryRules(data.items || []);
      }
    } catch (e) {
      console.error('Failed to fetch discovery rules:', e);
    } finally {
      setIsLoadingDiscovery(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await Promise.all([fetchMonitors(), fetchDiscoveryRules()]);
    setIsSyncing(false);
    alert('Lark Base との同期に成功しました。');
  };

  useEffect(() => {
    fetchMonitors();
    fetchDiscoveryRules();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-[var(--brand-blue-bg)] selection:text-[var(--brand-blue)]">
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-6 md:py-20">
        <header className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-blue-bg)] border border-[var(--brand-blue)]/10 text-[var(--brand-blue)] text-sm font-medium mb-10 animate-fade-in mx-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-blue)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-blue)]"></span>
            </span>
            業務の「見落とし」をゼロに
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-8 max-w-4xl mx-auto">
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--brand-blue)] to-blue-400 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <Image 
                src="/logo.png" 
                alt="Antigravity Watch Logo" 
                width={80}
                height={80}
                className="relative w-20 h-20 md:w-28 md:h-28 rounded-3xl shadow-2xl border-4 border-white dark:border-[var(--card-bg)] object-cover"
                priority
              />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight text-center md:text-left transition-all md:whitespace-nowrap">
              情報の変化を、<br className="sm:hidden" />
              <span className="text-[var(--brand-blue)]">あなたの代わりに。</span>
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Antigravity Watch は、ウェブサイトの更新をリアルタイムで監視し、
            大切な情報を逃さず Lark へお届けします。
          </p>
        </header>

        <main>
          {/* タブ切り替え */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-[var(--border-color)]">
              <button 
                onClick={() => setTab('monitors')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'monitors' ? 'bg-white dark:bg-slate-800 text-[var(--brand-blue)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                <List size={18} />
                監視リスト
              </button>
              <button 
                onClick={() => setTab('discovery')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'discovery' ? 'bg-white dark:bg-slate-800 text-[var(--brand-blue)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                <Search size={18} />
                URL自動追加設定
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* 左カラム: 登録フォーム */}
            <div className="lg:col-span-12 xl:col-span-5">
              <div className="bg-[var(--card-bg)] p-2 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[var(--border-color)]">
                {tab === 'monitors' ? (
                  <MonitorForm onSuccess={fetchMonitors} />
                ) : (
                  <DiscoveryForm onSuccess={fetchDiscoveryRules} />
                )}
              </div>
            </div>

            {/* 右カラム: リスト表示 */}
            <div className="lg:col-span-12 xl:col-span-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-center sm:text-left">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                      {tab === 'monitors' ? 'モニタリング一覧' : '自動追加設定一覧'}
                    </h2>
                    {baseInfo?.app_token && (
                      <a 
                        href={`https://www.larksuite.com/base/${baseInfo.app_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--brand-blue-bg)] text-[var(--brand-blue)] text-xs font-semibold hover:bg-[var(--brand-blue-bg)]/80 transition-colors border border-[var(--brand-blue)]/20"
                      >
                        <ExternalLink size={12} />
                        {baseInfo.name}
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {tab === 'monitors' ? '現在稼働中の監視タスクを管理できます' : '新しいURLを自動検知して追加する条件を設定できます'}
                  </p>
                </div>
                <button 
                  onClick={handleSync} 
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--card-bg)] hover:bg-slate-50 border border-[var(--border-color)] rounded-xl text-sm font-semibold text-[var(--text-primary)] shadow-sm transition-all disabled:opacity-50"
                >
                  <RefreshCw size={18} className={isSyncing ? 'animate-spin text-[var(--brand-blue)]' : 'text-[var(--text-secondary)]'} />
                  Lark Base から同期
                </button>
              </div>
              
              {tab === 'monitors' ? (
                <MonitorList monitors={monitors} isLoading={isLoadingMonitors} onRefresh={fetchMonitors} />
              ) : (
                <DiscoveryList rules={discoveryRules} isLoading={isLoadingDiscovery} onRefresh={fetchDiscoveryRules} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
