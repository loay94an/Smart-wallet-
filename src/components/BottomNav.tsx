import React from 'react';
import { LayoutDashboard, Receipt, Users, PieChart, MoreHorizontal } from 'lucide-react';

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
    { id: 'wallet', label: isRTL ? 'المعاملات' : 'Wallet', icon: <Receipt className="h-5 w-5" /> },
    { id: 'people', label: isRTL ? 'الأشخاص' : 'People', icon: <Users className="h-5 w-5" /> },
    { id: 'info', label: isRTL ? 'الميزانية' : 'Plan', icon: <PieChart className="h-5 w-5" /> },
    { id: 'more', label: isRTL ? 'المزيد' : 'More', icon: <MoreHorizontal className="h-5 w-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-purple-900/30 bg-[var(--surface)]/95 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 shadow-lg backdrop-blur-xl" aria-label={isRTL ? 'التنقل الرئيسي' : 'Main navigation'}>
      <div className="mx-auto flex max-w-xl items-center justify-around gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (tab.id === 'more' && (activeTab === 'work' || activeTab === 'tools'));
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors active:scale-95 ${
                isActive ? 'bg-[var(--accent-soft)] font-extrabold text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              {tab.icon}
              <span className="truncate text-[10px] sm:text-[11px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
