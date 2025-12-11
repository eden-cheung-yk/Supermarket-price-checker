
import React from 'react';
import { Home, Scan, History, Settings, Tag, ListChecks } from 'lucide-react';
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
    { view: ViewState.SHOPPING_LIST, icon: ListChecks, label: t.list },
    { view: ViewState.SCANNER, icon: Scan, label: t.scan, isMain: true },
    { view: ViewState.PRICE_CHECK, icon: Tag, label: t.price },
    { view: ViewState.SETTINGS, icon: Settings, label: t.settings },
  ];

  return (
    <>
      {/* Desktop Header */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 items-center justify-between px-8 shadow-sm">
         <div className="text-xl font-black tracking-tight text-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <Scan size={20} />
            </div>
            {translations[lang].appTitle}
         </div>
         <div className="flex gap-1">
             {navItems.map((item) => (
                 <button
                    key={item.view}
                    onClick={() => onChangeView(item.view)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        currentView === item.view 
                        ? 'bg-green-50 text-primary' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                 >
                     <item.icon size={18} />
                     {item.label}
                 </button>
             ))}
         </div>
      </div>

      {/* Mobile Floating Bar */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-gray-900/90 backdrop-blur-lg text-white rounded-2xl shadow-2xl p-2 flex justify-between items-center px-4 border border-white/10">
            {navItems.map((item) => {
                if (item.isMain) {
                    return (
                        <button
                            key={item.view}
                            onClick={() => onChangeView(item.view)}
                            className={`relative -top-6 bg-primary text-white p-4 rounded-full shadow-xl shadow-primary/40 transition-transform active:scale-90 border-4 border-gray-50`}
                        >
                            <item.icon size={28} />
                        </button>
                    );
                }
                return (
                    <button
                        key={item.view}
                        onClick={() => onChangeView(item.view)}
                        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                        currentView === item.view 
                            ? 'text-primary' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <item.icon size={22} strokeWidth={currentView === item.view ? 2.5 : 2} />
                        <span className="text-[9px] mt-1 font-medium">{item.label}</span>
                    </button>
                );
            })}
        </div>
      </div>
    </>
  );
};
