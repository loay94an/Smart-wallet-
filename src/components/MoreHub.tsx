import React from 'react';
import { ArrowLeft, BriefcaseBusiness, Calculator } from 'lucide-react';

interface MoreHubProps {
  onOpenWork: () => void;
  onOpenTools: () => void;
  language: 'ar' | 'en';
}

export const MoreHub: React.FC<MoreHubProps> = ({ onOpenWork, onOpenTools, language }) => {
  const isRTL = language === 'ar';
  const items = [
    {
      title: isRTL ? 'الأعمال والمشاريع' : 'Work & projects',
      description: isRTL ? 'إدارة الأعمال والعملاء والساعات والمستحقات' : 'Manage projects, clients, hours and payments',
      icon: <BriefcaseBusiness className="h-6 w-6" />,
      onClick: onOpenWork,
    },
    {
      title: isRTL ? 'الأدوات والمفكرة' : 'Tools & notes',
      description: isRTL ? 'الحاسبات المالية ومحوّل العملات والملاحظات والخرائط الذهنية' : 'Financial calculators, currency converter, notes and mind maps',
      icon: <Calculator className="h-6 w-6" />,
      onClick: onOpenTools,
    },
  ];

  return (
    <section className="mx-auto max-w-3xl space-y-4 px-1 pb-24 pt-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="space-y-1">
        <h2 className="text-xl font-black text-[var(--text-primary)]">{isRTL ? 'المزيد' : 'More'}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{isRTL ? 'الأقسام الإضافية والخدمات المتخصصة' : 'Additional sections and specialist tools'}</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <button key={item.title} type="button" onClick={item.onClick} className="flex min-h-36 items-center gap-4 rounded-2xl border border-[var(--border-neutral)] bg-[var(--surface)] p-4 text-start shadow-sm transition hover:border-[var(--accent)] active:scale-[0.99]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">{item.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-[var(--text-primary)]">{item.title}</span>
              <span className="mt-1 block text-xs leading-6 text-[var(--text-secondary)]">{item.description}</span>
            </span>
            <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          </button>
        ))}
      </div>
      <p className="rounded-xl bg-[var(--surface-muted)] p-3 text-xs leading-6 text-[var(--text-secondary)]">
        {isRTL ? 'الأقسام الأساسية موجودة دائماً في شريط التنقل أسفل الشاشة. لم يتم حذف أي أداة أو بيانات.' : 'Core sections stay in the bottom navigation. No tools or data have been removed.'}
      </p>
    </section>
  );
};
