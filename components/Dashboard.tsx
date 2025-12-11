import React, { useState, useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { Receipt } from '../types';
import { 
    TrendingUp, ShoppingBag, DollarSign, Calendar, ArrowUpRight, 
    ArrowDownRight, Store, Plus, Check, Wallet 
} from 'lucide-react';
import { translations, Language } from '../translations';
import { saveShoppingItem } from '../services/db';
import { generateId } from '../services/utils';

interface DashboardProps {
  receipts: Receipt[];
  lang: Language;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6'];

type TimeRange = 'all' | 'month' | 'lastMonth' | 'year';

export const Dashboard: React.FC<DashboardProps> = ({ receipts, lang }) => {
  const t = translations[lang].dashboard;
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  // --- 1. FILTER DATA BY TIME RANGE ---
  const filteredReceipts = useMemo<Receipt[]>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return receipts.filter(r => {
        const d = new Date(r.date || r.createdAt);
        if (timeRange === 'all') return true;
        if (timeRange === 'year') return d.getFullYear() === currentYear;
        if (timeRange === 'month') {
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }
        if (timeRange === 'lastMonth') {
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === lastMonth && d.getFullYear() === yearOfLastMonth;
        }
        return true;
    });
  }, [receipts, timeRange]);

  // --- 2. CALCULATE METRICS ---
  const totalSpent: number = filteredReceipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalCount = filteredReceipts.length;
  
  // Calculate Date Span for Daily Average
  const dateSpan = useMemo(() => {
     if (filteredReceipts.length === 0) return 1;
     const dates = filteredReceipts.map(r => new Date(r.date || r.createdAt).getTime());
     const min = Math.min(...dates);
     const max = Math.max(...dates);
     const diffDays = Math.max(1, Math.ceil((max - min) / (1000 * 60 * 60 * 24)));
     return diffDays;
  }, [filteredReceipts]);

  const dailyAverage = totalSpent / dateSpan;

  // Find Top Store
  const storeSpend = filteredReceipts.reduce((acc, r) => {
      const name = r.storeName || 'Unknown';
      acc[name] = (acc[name] || 0) + r.totalAmount;
      return acc;
  }, {} as Record<string, number>);
  
  const topStore = Object.entries(storeSpend).sort(([,a], [,b]) => Number(b) - Number(a))[0];

  // --- 3. CHARTS PREPARATION ---

  // Trend Chart (Area)
  const trendData = useMemo(() => {
      const grouped = filteredReceipts.reduce((acc, r) => {
          const d = new Date(r.date || r.createdAt);
          // Format date based on range
          let key = `${d.getMonth() + 1}/${d.getDate()}`;
          if (timeRange === 'year' || timeRange === 'all') key = `${d.getFullYear()}-${d.getMonth() + 1}`;
          
          if (!acc[key]) acc[key] = 0;
          acc[key] += r.totalAmount;
          return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(grouped)
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a,b) => a.name.localeCompare(b.name)); // Simplified sort
  }, [filteredReceipts, timeRange]);

  // Category Chart (Pie)
  const categoryData = useMemo(() => {
      const raw = filteredReceipts.reduce((acc, r) => {
          r.items.forEach(item => {
              const cat = item.category || 'Uncategorized';
              acc[cat] = (acc[cat] || 0) + (item.price * (item.quantity || 1));
          });
          return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(raw)
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a,b) => b.value - a.value);
  }, [filteredReceipts]);

  // Store Leaderboard (Bar)
  const storeData = useMemo(() => {
      return Object.entries(storeSpend)
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 5);
  }, [storeSpend]);

  // Restock Suggestions (Simplified for Demo - Logic remains similar to before)
  const suggestions = useMemo(() => {
     // Basic logic: Just show top items from history that aren't in the recent receipts
     // For this UI demo, we will generate static suggestions based on top items
     const itemCounts = receipts.reduce((acc, r) => {
         r.items.forEach(i => {
             acc[i.name] = (acc[i.name] || 0) + 1;
         });
         return acc;
     }, {} as Record<string, number>);
     
     return Object.entries(itemCounts)
        .sort((a,b) => Number(b[1]) - Number(a[1]))
        .slice(0, 3)
        .map(([name]) => ({ name }));
  }, [receipts]);

  const handleAddToList = async (name: string) => {
    await saveShoppingItem({ id: generateId(), name, isChecked: false });
    setAddedItems(prev => new Set(prev).add(name));
  };

  return (
    <div className="p-4 pb-28 md:pb-8 space-y-6 max-w-5xl mx-auto animate-fadeIn">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t.overview}</h1>
            <p className="text-gray-500 font-medium">{t.welcome}</p>
        </div>
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex overflow-hidden">
            {(['month', 'lastMonth', 'year', 'all'] as TimeRange[]).map((range) => (
                <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                        timeRange === range 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    {t.ranges[range]}
                </button>
            ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title={t.cards.total} 
            value={`$${totalSpent.toFixed(0)}`} 
            subValue={`.${totalSpent.toFixed(2).split('.')[1]}`}
            icon={<Wallet className="text-white" size={24} />}
            color="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <MetricCard 
            title={t.cards.receipts} 
            value={totalCount.toString()} 
            icon={<ShoppingBag className="text-white" size={24} />}
            color="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
           <MetricCard 
            title={t.cards.dailyAvg} 
            value={`$${dailyAverage.toFixed(0)}`} 
            subValue={`/ day`}
            icon={<TrendingUp className="text-white" size={24} />}
            color="bg-gradient-to-br from-violet-500 to-purple-600"
          />
           <MetricCard 
            title={t.cards.topStore} 
            value={topStore ? topStore[0] : '-'} 
            subValue={topStore ? `$${Number(topStore[1]).toFixed(0)}` : ''}
            icon={<Store className="text-white" size={24} />}
            color="bg-gradient-to-br from-orange-400 to-red-500"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart: Spending Trend */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><TrendingUp size={18}/></span>
                  {t.charts.spending}
              </h3>
              <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                          <defs>
                              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Store Leaderboard */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><Store size={18}/></span>
                  {t.charts.stores}
              </h3>
              <div className="space-y-4">
                  {storeData.map((store, idx) => (
                      <div key={idx} className="relative">
                          <div className="flex justify-between text-sm font-bold text-gray-700 mb-1 z-10 relative">
                              <span>{idx+1}. {store.name}</span>
                              <span>${store.value.toFixed(0)}</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full opacity-80" 
                                style={{ 
                                    width: `${((store.value as number) / (storeData[0]?.value || 1)) * 100}%`,
                                    backgroundColor: COLORS[idx % COLORS.length]
                                }}
                              ></div>
                          </div>
                      </div>
                  ))}
                  {storeData.length === 0 && <div className="text-gray-400 text-center py-10">No data</div>}
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
               <h3 className="font-bold text-gray-800 mb-4 w-full flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><ShoppingBag size={18}/></span>
                  {t.charts.categories}
              </h3>
               <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip />
                      </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="flex flex-wrap gap-2 justify-center mt-4">
                   {categoryData.slice(0, 4).map((c, i) => (
                       <div key={i} className="flex items-center gap-1 text-xs font-medium text-gray-500">
                           <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                           {c.name}
                       </div>
                   ))}
               </div>
          </div>

          {/* Smart Restock Widget */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-lg">
             <div className="flex items-center justify-between mb-4">
                 <div>
                    <h3 className="font-bold text-lg">{t.restock.title}</h3>
                    <p className="text-gray-400 text-xs">{t.restock.desc}</p>
                 </div>
                 <div className="bg-white/10 p-2 rounded-lg"><Calendar size={20} /></div>
             </div>
             
             <div className="space-y-3">
                 {suggestions.map((item, i) => (
                     <div key={i} className="flex items-center justify-between bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/5">
                         <span className="font-bold text-sm">{item.name}</span>
                         <button 
                            onClick={() => handleAddToList(item.name)}
                            disabled={addedItems.has(item.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${addedItems.has(item.name) ? 'bg-green-500 text-white' : 'bg-white text-gray-900 hover:bg-gray-200'}`}
                         >
                            {addedItems.has(item.name) ? <Check size={14}/> : <Plus size={14}/>}
                            {addedItems.has(item.name) ? t.restock.added : t.restock.add}
                         </button>
                     </div>
                 ))}
                 {suggestions.length === 0 && <div className="text-gray-500 text-center py-4">{t.restock.empty}</div>}
             </div>
          </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subValue, icon, color }: any) => (
    <div className={`${color} rounded-3xl p-5 text-white shadow-lg shadow-gray-200/50 relative overflow-hidden`}>
        <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <div className="text-2xl lg:text-3xl font-black">
                {value}<span className="text-lg opacity-60 font-medium">{subValue}</span>
            </div>
        </div>
        <div className="absolute right-4 top-4 opacity-20 transform scale-150 pointer-events-none">
            {icon}
        </div>
    </div>
);