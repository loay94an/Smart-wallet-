import React from 'react';
import { LayoutDashboard, Receipt, Users, BriefcaseBusiness, MoreHorizontal } from 'lucide-react';

export type NavTab = 'dashboard' | 'wallet' | 'people' | 'work' | 'info' | 'tools' | 'more';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: 'ar' | 'en';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, language }) => {
  const isRTL = language === 'ar';
  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: isRTL ? 'الرئيسية' : 'Home', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'wallet', label: isRTL ? 'المعاملات' : 'Transactions', icon: <Receipt className="h-5 w-5" /> },
    { id: 'people', label: isRTL ? 'الأشخاص' : 'People', icon: <Users className="h-5 w-5" /> },
    { id: 'work', label: isRTL ? 'العمل' : 'Work', icon: <BriefcaseBusiness className="h-5 w-5" /> },
    { id: 'more', label: isRTL ? 'المزيد' : 'More', icon: <MoreHorizontal className="h-5 w-5" /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-neutral)] bg-[var(--surface)]/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-lg backdrop-blur-xl" aria-label={isRTL ? 'التنقل الرئيسي' : 'Main navigation'}>
      <div className="mx-auto flex max-w-3xl items-stretch gap-1 px-2">
        {tabs.map((tab) => {
          const active = activeTab === tab.id || (tab.id === 'more' && (activeTab === 'info' || activeTab === 'tools'));
          return <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} aria-current={active ? 'page' : undefined} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 transition-colors active:scale-95 ${active ? 'bg-[var(--accent-soft)] font-extrabold text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'}`}>
            {tab.icon}<span className="whitespace-nowrap text-[10px]">{tab.label}</span>
          </button>;
        })}
      </div>
    </nav>
  );
};
