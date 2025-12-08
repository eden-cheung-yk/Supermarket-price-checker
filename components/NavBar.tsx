
import React from 'react';
import { Home, Scan, History, Settings, Tag } from 'lucide-react';
import { ViewState } from '../types';
import { translations, Language } from '../translations';

interface NavBarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  lang: Language;
}

export const NavBar: React.FC<NavBarProps> = ({ currentView, onChangeView, lang }) => {
  const t = translations[lang].nav;
  
  const navItems = [
    { view: ViewState.DASHBOARD, icon: Home, label: t.home },
    { view: ViewState.SCANNER, icon: Scan, label: t.scan },
    { view: ViewState.PRICE_CHECK, icon: Tag, label: t.price },
    { view: ViewState.HISTORY, icon: History, label: t.history },
    { view: ViewState.SETTINGS, icon: Settings, label: t.settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-4 shadow-lg z-50 md:top-0 md:bottom-auto md:h-16 md:flex md:items-center md:justify-between md:px-8">
      <div className="hidden md:block text-xl font-bold text-primary">{translations[lang].appTitle}</div>
      <div className="flex justify-around items-center w-full md:w-auto md:gap-6">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              currentView === item.view 
                ? 'text-primary' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon size={22} strokeWidth={currentView === item.view ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium uppercase tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
