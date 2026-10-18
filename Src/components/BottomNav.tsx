import React from 'react';
import { LayoutDashboard, Receipt, Briefcase, PieChart, Wrench } from 'lucide-react';

export type NavTab = 'dashboard' | 'wallet' | 'people' | 'work' | 'info' | 'tools';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: 'ar' | 'en';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, language }) => {
  const isRTL = language === 'ar';

  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: isRTL ? 'الرئيسية' : 'Home',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      id: 'wallet',
      label: isRTL ? 'المحفظة' : 'Wallet',
      icon: <Receipt className="h-5 w-5" />,
    },
    {
      id: 'work',
      label: isRTL ? 'العمل' : 'Work',
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      id: 'info',
      label: isRTL ? 'المعلومات' : 'Hub',
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      id: 'tools',
      label: isRTL ? 'الأدوات والمفكرة' : 'Tools & Notes',
      icon: <Wrench className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-purple-900/40 bg-[#0d0d1e]/95 backdrop-blur-xl px-2 py-1.5 shadow-2xl">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-1 flex-col items-center justify-center rounded-xl py-1.5 transition-all duration-200 ${
                isActive
                  ? 'bg-purple-600/20 text-purple-400 font-extrabold shadow-sm'
                  : 'text-purple-300/60 hover:text-purple-200'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110 text-purple-400' : ''}`}>
                {tab.icon}
              </div>
              <span className="mt-1 text-[11px] font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
