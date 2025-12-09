
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Receipt } from '../types';
import { TrendingUp, ShoppingBag, DollarSign, MapPin, ExternalLink } from 'lucide-react';
import { translations, Language } from '../translations';

interface DashboardProps {
  receipts: Receipt[];
  lang: Language;
}

const PROVINCES = ['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NS', 'NB'];

// Static Links to major flyer aggregators in Canada to avoid AI API usage
const FLYER_LINKS: Record<string, string> = {
    'ON': 'https://flyers.smartcanucks.ca/canada/ontario-flyers',
    'BC': 'https://flyers.smartcanucks.ca/canada/british-columbia-flyers',
    'AB': 'https://flyers.smartcanucks.ca/canada/alberta-flyers',
    'QC': 'https://flyers.smartcanucks.ca/canada/quebec-flyers',
};

export const Dashboard: React.FC<DashboardProps> = ({ receipts, lang }) => {
  const t = translations[lang].dashboard;
  const [province, setProvince] = useState(localStorage.getItem('smartprice_province') || 'ON');

  // Calculate totals
  const totalSpent = receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalReceipts = receipts.length;
  
  // Chart Data
  const chartData = receipts.reduce((acc, r) => {
    const date = new Date(r.date || r.createdAt);
    const key = `${date.getMonth() + 1}/${date.getDate()}`;
    const existing = acc.find(d => d.name === key);
    if (existing) {
      existing.amount += r.totalAmount;
    } else {
      acc.push({ name: key, amount: r.totalAmount });
    }
    return acc;
  }, [] as {name: string, amount: number}[]).slice(-7);

  useEffect(() => {
    localStorage.setItem('smartprice_province', province);
  }, [province]);

  const flyerLink = FLYER_LINKS[province] || 'https://flyers.smartcanucks.ca/';

  return (
    <div className="p-4 pb-24 space-y-6 max-w-4xl mx-auto">
      {/* Header with Province Selector */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.overview}</h1>
          <p className="text-gray-500 text-sm">{t.welcome}</p>
        </div>
        <div className="flex flex-col items-end">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">{t.province}</label>
            <div className="relative">
                <MapPin size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-primary" />
                <select 
                    value={province} 
                    onChange={(e) => setProvince(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg pl-7 pr-2 py-1 text-sm font-bold text-gray-700 outline-none focus:border-primary shadow-sm appearance-none"
                >
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <DollarSign size={20} />
            <span className="text-sm font-medium">{t.totalSpent}</span>
          </div>
          <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <ShoppingBag size={20} />
            <span className="text-sm font-medium">{t.receipts}</span>
          </div>
          <div className="text-2xl font-bold">{totalReceipts}</div>
        </div>
      </div>

      {/* Weekly Deals Shortcuts (Replaced AI with Links) */}
      <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                  <ExternalLink size={18} className="text-yellow-400" /> 
                  {t.weeklyDeals} ({province})
              </h3>
          </div>
          <div className="p-5">
              <p className="text-white/80 text-sm mb-4">{t.dealsDesc} {province}</p>
              
              <div className="grid grid-cols-1 gap-3">
                 <a href={flyerLink} target="_blank" rel="noopener noreferrer" className="block bg-white/10 hover:bg-white/20 p-3 rounded-lg border border-white/10 transition-colors flex justify-between items-center">
                    <span className="font-bold">SmartCanucks Flyers</span>
                    <ExternalLink size={16} />
                 </a>
                 <a href="https://flipp.com/" target="_blank" rel="noopener noreferrer" className="block bg-white/10 hover:bg-white/20 p-3 rounded-lg border border-white/10 transition-colors flex justify-between items-center">
                    <span className="font-bold">Flipp.com</span>
                    <ExternalLink size={16} />
                 </a>
              </div>
          </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-64 flex flex-col">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={18} /> {t.spendingTrend}
        </h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                cursor={{ fill: '#f3f4f6' }}
              />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
