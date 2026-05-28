import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
  LineChart,
  Line,
} from "recharts";
import { FilterState, SalesData } from "../types";
import { cn, formatCurrency, formatPercent } from "../lib/utils";
import { TrendingUp, TrendingDown, DollarSign, MapPin, Building, Filter, Info, X, Sun, Moon, Minus, ChevronDown, Check } from "lucide-react";

const CATEGORY_COLORS = ["#8B5CF6", "#E7AEA0", "#10B981", "#F59E0B", "#722F37", "#06b6d4", "#14b8a6", "#a855f7"];

const getCategoryColor = (name: string, isDark: boolean) => {
  const norm = name.toUpperCase();
  if (norm.includes("PERFUMARIA")) return "#8B5CF6";
  if (norm.includes("COSMÉTICO") || norm.includes("COSMETICO")) return "#E7AEA0";
  if (norm.includes("ACESSÓRIO") || norm.includes("ACESSORIO")) return "#10B981";
  if (norm.includes("CASA") || norm.includes("DECOR")) return "#F59E0B";
  if (norm.includes("BEBIDA")) return "#722F37";
  return isDark ? "#06b6d4" : "#2563eb"; // Fallback color
};

interface DashboardProps {
  data: SalesData[];
  period?: string;
  onReset?: () => void;
  type: 'mensal' | 'anual';
  title: string;
}

export function Dashboard({ data, period, onReset, type, title }: DashboardProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lineChartMode, setLineChartMode] = useState<'faturamento' | 'crescimento'>('faturamento');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'loja' | 'mes' | null>(null);
  
  const [filter, setFilter] = useState<FilterState>({
    cidade: null,
    loja: [],
    setor: null,
    ano: null,
    mes: [],
  });

  const theme = isDarkMode ? {
    bgApp: "bg-[#0F172A] text-slate-50",
    bgCard: "bg-[#1F2937] border-slate-700",
    bgFilter: "bg-[#111827] border-slate-800",
    bgInsights: "bg-slate-900 border-slate-800",
    textMain: "text-slate-100",
    textMuted: "text-slate-400",
    textHighlight: "text-cyan-400",
    textChartTitle: "text-slate-300",
    gridLine: "#374151",
    chartTick: "#94a3b8",
    tooltipBg: "#1F2937",
    tooltipBorder: "#374151",
    tooltipText: "#f8fafc",
    btnPrimary: "bg-cyan-600 text-slate-950 hover:bg-cyan-500",
    btnSecondary: "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700",
    bar2025: "#334155",
    bar2026: "#06b6d4",
    chartCursor: "#1e293b",
    positive: "#22C55E",
    negative: "#EF4444",
    neutral: "#6B7280"
  } : {
    bgApp: "bg-[#F5F6FA] text-slate-900",
    bgCard: "bg-white border-gray-200 shadow-sm",
    bgFilter: "bg-white border-gray-200 shadow-sm",
    bgInsights: "bg-white border-gray-200 shadow-sm",
    textMain: "text-slate-900",
    textMuted: "text-slate-500",
    textHighlight: "text-blue-600",
    textChartTitle: "text-[#475569]",
    gridLine: "#E5E7EB",
    chartTick: "#475569",
    tooltipBg: "#ffffff",
    tooltipBorder: "#E5E7EB",
    tooltipText: "#111827",
    btnPrimary: "bg-blue-600 text-white hover:bg-blue-700",
    btnSecondary: "bg-white border-gray-300 text-slate-700 hover:bg-gray-50",
    bar2025: "#D1D5DB",
    bar2026: "#3B82F6",
    chartCursor: "#F3F4F6",
    positive: "#22C55E",
    negative: "#EF4444",
    neutral: "#6B7280"
  };

  const toggleFilter = (key: keyof FilterState, value: string | number) => {
    if (!value) return;
    setFilter(prev => {
      if (key === 'loja' || key === 'mes') {
        const currentArr = prev[key] as string[];
        const strVal = String(value);
        if (currentArr.includes(strVal)) {
          return { ...prev, [key]: currentArr.filter(v => v !== strVal) };
        } else {
          return { ...prev, [key]: [...currentArr, strVal] };
        }
      } else {
        return { ...prev, [key]: prev[key] === value ? null : value };
      }
    });
  };

  const selectAll = (key: 'loja' | 'mes', values: (string | number)[]) => {
    setFilter(prev => ({ ...prev, [key]: values.map(String) }));
  };

  const deselectAll = (key: 'loja' | 'mes') => {
    setFilter(prev => ({ ...prev, [key]: [] }));
  };

  // Extract unique values for filters
  const cidades = useMemo(() => Array.from(new Set(data.map((d) => d.cidade))).sort(), [data]);
  const lojas = useMemo(() => Array.from(new Set(data.map((d) => d.loja))).sort(), [data]);
  const setores = useMemo(() => Array.from(new Set(data.map((d) => d.setor))).sort(), [data]);
  const anos = useMemo(() => Array.from(new Set(data.map((d) => d.ano))).sort((a,b)=>b-a), [data]);
  
  const monthOrder = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const meses = useMemo(() => Array.from(new Set(data.filter(d => d.mes).map((d) => d.mes as string | number))).sort((a,b)=> {
    const aStr = String(a).toLowerCase();
    const bStr = String(b).toLowerCase();
    const aIndex = monthOrder.indexOf(aStr);
    const bIndex = monthOrder.indexOf(bStr);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return aStr.localeCompare(bStr);
  }), [data]);

  // Base Data = Ignoring Year filter for YoY calculations
  const baseData = useMemo(() => {
    return data.filter((d) => {
      if (filter.cidade && d.cidade !== filter.cidade) return false;
      if (filter.loja.length > 0 && !filter.loja.includes(d.loja)) return false;
      if (filter.setor && d.setor !== filter.setor) return false;
      if (filter.mes.length > 0 && (!d.mes || !filter.mes.includes(String(d.mes)))) return false;
      return true;
    });
  }, [data, filter.cidade, filter.loja, filter.setor, filter.mes]);

  const baseDataIgnoringMonth = useMemo(() => {
    return data.filter((d) => {
      if (filter.cidade && d.cidade !== filter.cidade) return false;
      if (filter.loja.length > 0 && !filter.loja.includes(d.loja)) return false;
      if (filter.setor && d.setor !== filter.setor) return false;
      return true;
    });
  }, [data, filter.cidade, filter.loja, filter.setor]);

  const yoyMensal = useMemo(() => {
    const map = new Map<string, { v25: number; v26: number }>();
    if (type !== 'anual') return [];
    
    baseDataIgnoringMonth.forEach(d => {
      if (!d.mes) return;
      const mesStr = String(d.mes);
      if(!map.has(mesStr)) map.set(mesStr, { v25: 0, v26: 0 });
      if(d.ano === 2025) map.get(mesStr)!.v25 += d.valor;
      if(d.ano === 2026) map.get(mesStr)!.v26 += d.valor;
    });
    
    return Array.from(map.entries()).map(([name, vals]) => {
      const growth = vals.v25 === 0 ? (vals.v26 > 0 ? 1 : 0) : (vals.v26 - vals.v25) / vals.v25;
      const diff = vals.v26 - vals.v25;
      return { 
        name, 
        ...vals, 
        growth, 
        diff,
        order: isNaN(Number(name)) ? name : Number(name) 
      };
    }).sort((a, b) => {
      if (typeof a.order === 'number' && typeof b.order === 'number') return a.order - b.order;
      return String(a.order).localeCompare(String(b.order));
    });
  }, [baseDataIgnoringMonth, type]);

  // Current View Data = includes year filter
  const currentData = useMemo(() => {
    return baseData.filter((d) => {
      if (filter.ano && d.ano !== filter.ano) return false;
      return true;
    });
  }, [baseData, filter.ano]);

  // Overall KPIs
  const total2025 = useMemo(() => baseData.filter(d => d.ano === 2025).reduce((acc, curr) => acc + curr.valor, 0), [baseData]);
  const total2026 = useMemo(() => baseData.filter(d => d.ano === 2026).reduce((acc, curr) => acc + curr.valor, 0), [baseData]);
  const growthOverall = total2025 === 0 ? 0 : (total2026 - total2025) / total2025;
  const diffOverall = total2026 - total2025;

  const currentTotal = useMemo(() => currentData.reduce((acc, curr) => acc + curr.valor, 0), [currentData]);

  // Year Over Year by Setor/Loja/Cidade
  const yoySetor = useMemo(() => {
    const map = new Map<string, { v25: number; v26: number }>();
    baseData.forEach(d => {
      if(!map.has(d.setor)) map.set(d.setor, { v25: 0, v26: 0 });
      if(d.ano === 2025) map.get(d.setor)!.v25 += d.valor;
      if(d.ano === 2026) map.get(d.setor)!.v26 += d.valor;
    });
    return Array.from(map.entries()).map(([name, vals]) => {
      const growth = vals.v25 === 0 ? 0 : (vals.v26 - vals.v25) / vals.v25;
      return { name, ...vals, growth, color: getCategoryColor(name, isDarkMode) };
    }).sort((a,b) => b.growth - a.growth);
  }, [baseData, isDarkMode]);

  const yoyLoja = useMemo(() => {
    const map = new Map<string, { v25: number; v26: number, cidade: string }>();
    baseData.forEach(d => {
      if(!map.has(d.loja)) map.set(d.loja, { v25: 0, v26: 0, cidade: d.cidade });
      if(d.ano === 2025) map.get(d.loja)!.v25 += d.valor;
      if(d.ano === 2026) map.get(d.loja)!.v26 += d.valor;
    });
    return Array.from(map.entries()).map(([name, vals]) => {
      const growth = vals.v25 === 0 ? 0 : (vals.v26 - vals.v25) / vals.v25;
      return { name, ...vals, growth };
    }).sort((a,b) => b.growth - a.growth);
  }, [baseData]);

  const yoyCidade = useMemo(() => {
    const map = new Map<string, { v25: number; v26: number }>();
    let total25 = 0;
    let total26 = 0;
    baseData.forEach(d => {
      if(!map.has(d.cidade)) map.set(d.cidade, { v25: 0, v26: 0 });
      if(d.ano === 2025) { map.get(d.cidade)!.v25 += d.valor; total25 += d.valor; }
      if(d.ano === 2026) { map.get(d.cidade)!.v26 += d.valor; total26 += d.valor; }
    });
    const cities = Array.from(map.entries()).map(([name, vals]) => {
      const growth = vals.v25 === 0 ? 0 : (vals.v26 - vals.v25) / vals.v25;
      return { name, ...vals, growth };
    }).sort((a,b) => b.growth - a.growth);
    
    const totalGrowth = total25 === 0 ? 0 : (total26 - total25) / total25;
    cities.unshift({ name: "ZONA FRANCA", v25: total25, v26: total26, growth: totalGrowth });
    return cities;
  }, [baseData]);

  // Setup logic for auto insights
  const latestYear = anos.length > 0 ? anos[0] : 2026;
  const latestYearData = useMemo(() => baseData.filter(d => d.ano === latestYear), [baseData, latestYear]);
  const latestTotal = useMemo(() => latestYearData.reduce((acc, curr) => acc + curr.valor, 0), [latestYearData]);

  const byCidadeRecent = useMemo(() => {
    const grouped = latestYearData.reduce((acc, curr) => {
      acc[curr.cidade] = (acc[curr.cidade] || 0) + curr.valor;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Number(value), share: Number(value) / latestTotal }))
      .sort((a, b) => b.value - a.value);
  }, [latestYearData, latestTotal]);

  const byLojaRecent = useMemo(() => {
    const grouped = latestYearData.reduce((acc, curr) => {
      acc[curr.loja] = (acc[curr.loja] || 0) + curr.valor;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped)
      .map(([name, value]) => {
        const yoy = yoyLoja.find(l => l.name === name);
        return { name, value: Number(value), share: Number(value) / latestTotal, growth: yoy ? yoy.growth : 0 };
      })
      .sort((a, b) => b.value - a.value);
  }, [latestYearData, latestTotal, yoyLoja]);

  const salesLoja = useMemo(() => [...yoyLoja].sort((a,b) => b.v26 - a.v26), [yoyLoja]);

  const isLojaSelected = !!filter.loja;
  const topGrowthSetor = yoySetor.length > 0 ? yoySetor[0] : null;
  const bottomSetor = yoySetor.length > 0 ? [...yoySetor].sort((a,b) => a.growth - b.growth)[0] : null;
  const bestCidadeRecent = byCidadeRecent.length > 0 ? byCidadeRecent[0] : null;
  const bottomLojas = yoyLoja.filter(l => l.growth < 0).sort((a,b) => a.growth - b.growth);

  const bySetorRecent = useMemo(() => {
    const grouped = latestYearData.reduce((acc, curr) => {
      acc[curr.setor] = (acc[curr.setor] || 0) + curr.valor;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [latestYearData]);
  const bestSetorRecent = bySetorRecent.length > 0 ? bySetorRecent[0] : null;
  const topGrowthLoja = yoyLoja.length > 0 ? yoyLoja[0] : null;

  const CustomTooltip = ({ active, payload, label, hideDifference }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const hasDifference = data.v26 !== undefined && data.v25 !== undefined;
      return (
        <div className={`p-3 border rounded-lg shadow-xl text-xs z-50`} style={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.tooltipText }}>
          <p className="font-bold mb-2 text-sm">{label}</p>
          <p className={theme.textMuted}>Vendas {latestYear}: <span className="font-bold" style={{color: theme.bar2026}}>{formatCurrency(data.v26 !== undefined ? data.v26 : data.value)}</span></p>
          {data.v25 !== undefined && (
            <p className={theme.textMuted}>Vendas {latestYear - 1}: <span className="font-bold" style={{color: theme.neutral}}>{formatCurrency(data.v25)}</span></p>
          )}
          {data.share !== undefined && (
             <p className={theme.textMuted}>Participação: <span className="font-bold">{formatPercent(data.share)}</span></p>
          )}
          {data.growth !== undefined && (
            <div className="mt-2 pt-2 border-t text-sm flex flex-col gap-1" style={{ borderColor: theme.gridLine }}>
              {!hideDifference && hasDifference && (
                <p className={theme.textMuted}>Diferença: <span className="font-bold" style={{ color: data.v26 - data.v25 > 0 ? theme.positive : data.v26 - data.v25 < 0 ? theme.negative : theme.neutral }}>{formatCurrency(data.v26 - data.v25)}</span></p>
              )}
              <p className={theme.textMuted}>Crescimento: <span className="font-bold" style={{ color: data.growth > 0 ? theme.positive : data.growth < 0 ? theme.negative : theme.neutral }}>{formatPercent(data.growth)}</span></p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen ${theme.bgApp} font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-200`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${theme.textMain} uppercase transition-colors`}>
            {title}
          </h1>
          <p className={`${theme.textMuted} mt-1 font-medium`}>Análise Executiva de Vendas e Crescimento</p>
          {period && <p className={`text-sm mt-1 font-bold ${theme.textHighlight}`}>{period}</p>}
        </div>
        <div className="flex items-center gap-3 no-print">
           <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-4 py-2 border rounded-lg shadow-sm font-medium transition-colors flex items-center gap-2 ${theme.btnSecondary}`}
            title="Alternar Modo"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className={`px-4 py-2 border rounded-lg shadow-sm font-medium transition-colors ${theme.btnSecondary}`}
            >
              Novo Arquivo
            </button>
          )}
          <button
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm font-bold uppercase transition-colors ${theme.btnSecondary} ${isFilterVisible ? (isDarkMode ? '!bg-slate-700' : '!bg-slate-200') : ''}`}
            title="Alternar Filtros"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>
      </div>

      {/* Filters (Applies globally to base dataset) */}
      {isFilterVisible && (
        <div className={`max-w-7xl mx-auto mb-8 p-4 rounded-xl border shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${meses.length > 0 ? '5' : '4'} gap-4 ${theme.bgFilter} transition-colors`}>
          <div>
            <label className={`block text-xs font-bold ${theme.textMuted} uppercase tracking-wider mb-2`}>Cidade</label>
            <select
              title="Cidade"
              className={`w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${theme.bgApp} ${theme.textMain}`}
              style={{ borderColor: theme.gridLine }}
              value={filter.cidade || ""}
              onChange={(e) => setFilter(f => ({ ...f, cidade: e.target.value || null }))}
            >
              <option value="">Todas</option>
              {cidades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
         </div>
         <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className={`block text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>Loja</label>
            </div>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'loja' ? null : 'loja')}
              className={`w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none flex justify-between items-center ${theme.bgApp} ${theme.textMain}`}
              style={{ borderColor: theme.gridLine }}
            >
              <span className="truncate">{filter.loja.length > 0 ? `${filter.loja.length} selecionada(s)` : 'Todas'}</span>
              <ChevronDown size={14} className={`transition-transform ${openDropdown === 'loja' ? 'rotate-180' : ''}`} />
            </button>
            
            {openDropdown === 'loja' && (
              <div className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg ${theme.bgApp} ${theme.textMain} max-h-60 overflow-y-auto`} style={{ borderColor: theme.gridLine }}>
                <div className={`p-2 border-b flex justify-between sticky top-0 bg-opacity-95 ${theme.bgApp}`} style={{ borderColor: theme.gridLine, backdropFilter: 'blur(4px)' }}>
                  <button onClick={() => selectAll('loja', lojas)} className={`text-[10px] uppercase font-bold text-blue-500 hover:text-blue-600`}>Todos</button>
                  <button onClick={() => deselectAll('loja')} className={`text-[10px] uppercase font-bold text-red-500 hover:text-red-600`}>Nenhum</button>
                </div>
                <div className="p-1">
                  {lojas.map(c => {
                    const isSelected = filter.loja.includes(String(c));
                    return (
                      <label key={c} className={`flex items-center gap-2 cursor-pointer p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded ${isSelected ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                          {isSelected && <Check size={10} className="text-white dropdown-check" strokeWidth={3} />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={() => toggleFilter('loja', c)}
                        />
                        <span className="text-sm truncate select-none">{c}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
         </div>
         <div>
            <label className={`block text-xs font-bold ${theme.textMuted} uppercase tracking-wider mb-2`}>Setor</label>
            <select
              title="Setor"
              className={`w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${theme.bgApp} ${theme.textMain}`}
              style={{ borderColor: theme.gridLine }}
              value={filter.setor || ""}
              onChange={(e) => setFilter(f => ({ ...f, setor: e.target.value || null }))}
            >
              <option value="">Todos</option>
              {setores.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
         </div>
         {meses.length > 0 && (
           <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>Mês</label>
              </div>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'mes' ? null : 'mes')}
                className={`w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none flex justify-between items-center ${theme.bgApp} ${theme.textMain}`}
                style={{ borderColor: theme.gridLine }}
              >
                <span className="truncate">{filter.mes.length > 0 ? `${filter.mes.length} selecionado(s)` : 'Todos'}</span>
                <ChevronDown size={14} className={`transition-transform ${openDropdown === 'mes' ? 'rotate-180' : ''}`} />
              </button>
              
              {openDropdown === 'mes' && (
                <div className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg ${theme.bgApp} ${theme.textMain} max-h-60 overflow-y-auto`} style={{ borderColor: theme.gridLine }}>
                  <div className={`p-2 border-b flex justify-between sticky top-0 bg-opacity-95 ${theme.bgApp}`} style={{ borderColor: theme.gridLine, backdropFilter: 'blur(4px)' }}>
                    <button onClick={() => selectAll('mes', meses.map(String))} className={`text-[10px] uppercase font-bold text-blue-500 hover:text-blue-600`}>Todos</button>
                    <button onClick={() => deselectAll('mes')} className={`text-[10px] uppercase font-bold text-red-500 hover:text-red-600`}>Nenhum</button>
                  </div>
                  <div className="p-1">
                    {meses.map(m => {
                      const isSelected = filter.mes.includes(String(m));
                      return (
                        <label key={m} className={`flex items-center gap-2 cursor-pointer p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded ${isSelected ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                            {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => toggleFilter('mes', String(m))}
                          />
                          <span className="text-sm truncate select-none">{m}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
           </div>
         )}
         <div>
            <label className={`block text-xs font-bold ${theme.textMuted} uppercase tracking-wider mb-2`}>Ano Foco</label>
            <select
              title="Ano Foco"
              className={`w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${theme.bgApp} ${theme.textMain}`}
              style={{ borderColor: theme.gridLine }}
              value={filter.ano || ""}
              onChange={(e) => setFilter(f => ({ ...f, ano: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">Ambos (2025 e 2026)</option>
              {anos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
         </div>
      </div>
      )}

      {/* Active Filters */}
      {Object.values(filter).some(val => val !== null && (!Array.isArray(val) || val.length > 0)) && (
        <div className={`max-w-7xl mx-auto mb-6 flex flex-wrap gap-2 items-center text-sm p-3 rounded-lg border ${theme.bgFilter}`}>
          <span className={`${theme.textMuted} font-bold uppercase text-[10px] mr-2`}>Filtros Ativos:</span>
          {filter.cidade && (
            <span className={`border px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold ${isDarkMode ? 'bg-cyan-900/50 text-cyan-200 border-cyan-800' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              <span className="opacity-70 font-normal">Cidade:</span> {filter.cidade}
              <button onClick={() => toggleFilter('cidade', filter.cidade!)} className={`hover:opacity-100 opacity-60 transition-colors`} title="Remover filtro"><X size={14} /></button>
            </span>
          )}
          {filter.loja.length > 0 && (
             <span className={`border px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold ${isDarkMode ? 'bg-purple-900/50 text-purple-200 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
              <span className="opacity-70 font-normal">Loja:</span> {filter.loja.length > 2 ? `${filter.loja.length} selecionadas` : filter.loja.join(', ')}
              <button onClick={() => deselectAll('loja')} className={`hover:opacity-100 opacity-60 transition-colors`} title="Remover filtro"><X size={14} /></button>
            </span>
          )}
          {filter.setor && (
            <span className={`border px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold ${isDarkMode ? 'bg-emerald-900/50 text-emerald-200 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <span className="opacity-70 font-normal">Setor:</span> {filter.setor}
              <button onClick={() => toggleFilter('setor', filter.setor!)} className={`hover:opacity-100 opacity-60 transition-colors`} title="Remover filtro"><X size={14} /></button>
            </span>
          )}
          {filter.ano && (
             <span className={`border px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold ${isDarkMode ? 'bg-rose-900/50 text-rose-200 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              <span className="opacity-70 font-normal">Ano:</span> {filter.ano}
              <button onClick={() => toggleFilter('ano', filter.ano!)} className={`hover:opacity-100 opacity-60 transition-colors`} title="Remover filtro"><X size={14} /></button>
            </span>
          )}
          {filter.mes.length > 0 && (
             <span className={`border px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold ${isDarkMode ? 'bg-indigo-900/50 text-indigo-200 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
              <span className="opacity-70 font-normal">Mês:</span> {filter.mes.length > 2 ? `${filter.mes.length} meses` : filter.mes.join(', ')}
              <button onClick={() => deselectAll('mes')} className={`hover:opacity-100 opacity-60 transition-colors`} title="Remover filtro"><X size={14} /></button>
            </span>
          )}
          <button onClick={() => setFilter({ cidade: null, loja: [], setor: null, ano: null, mes: [] })} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 uppercase font-bold ml-2">
            Limpar Todos
          </button>
        </div>
      )}

      <div id="dashboard-content" className="max-w-7xl mx-auto space-y-6">
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Total Vendas 2025"
            value={formatCurrency(total2025)}
            icon={<DollarSign className="w-5 h-5 text-blue-500" />}
            theme={theme}
          />
          <KpiCard
            title="Total Vendas 2026"
            value={formatCurrency(total2026)}
            icon={<DollarSign className={`w-5 h-5`} style={{color: theme.positive}} />}
            theme={theme}
          />
          <div className={`${theme.bgCard} p-4 rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between transition-colors`}>
             <div className="flex justify-between items-start mb-4">
               <span className={`text-[10px] uppercase font-bold ${theme.textMuted}`}>Crescimento YoY</span>
               <div 
                 className="p-2 rounded-lg opacity-80" 
                 style={{ backgroundColor: growthOverall > 0 ? theme.positive : growthOverall < 0 ? theme.negative : theme.neutral }}
               >
                  {growthOverall > 0 ? <TrendingUp className="w-5 h-5 text-white" /> : growthOverall < 0 ? <TrendingDown className="w-5 h-5 text-white"/> : <Minus className="w-5 h-5 text-white"/> }
               </div>
             </div>
             <p className="text-2xl font-bold tracking-tight" style={{ color: growthOverall > 0 ? theme.positive : growthOverall < 0 ? theme.negative : theme.neutral }}>
               {formatPercent(growthOverall)}
             </p>
          </div>
          <KpiCard
            title="Diferença Absoluta YoY"
            value={formatCurrency(diffOverall)}
            icon={<DollarSign className="w-5 h-5 text-purple-500" />}
            theme={theme}
          />
        </div>

        {/* Auto Insights */}
         <div className={`${theme.bgInsights} border p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex gap-4 items-start transition-colors`}>
            <Info className={`w-6 h-6 shrink-0 mt-1 ${theme.textHighlight}`} />
            <div>
              <h3 className={`text-[10px] uppercase font-bold mb-2 tracking-wider ${theme.textHighlight}`}>Auto-Insights</h3>
              <ul className={`text-[13px] space-y-2 leading-relaxed list-inside ${theme.textMuted}`}>
                {!isLojaSelected && !filter.cidade && bestCidadeRecent && (
                  <li>
                    A cidade com maior participação em {latestYear} é <strong className={theme.textMain}>{bestCidadeRecent.name}</strong>, concentrando {formatPercent(bestCidadeRecent.share)} do faturamento total, sendo o principal polo da operação.
                  </li>
                )}
                
                {!filter.setor && topGrowthSetor && topGrowthSetor.growth > 0 && (
                  <li>
                    O setor com maior crescimento é <strong className={theme.textMain}>{topGrowthSetor.name}</strong> (<span style={{color: theme.positive}}>{formatPercent(topGrowthSetor.growth)}</span>), indicando forte potencial de expansão e oportunidade de investimento.
                  </li>
                )}

                {!filter.setor && bestSetorRecent && (!topGrowthSetor || bestSetorRecent.name !== topGrowthSetor.name) && (
                  <li>
                    Apesar disso, <strong className={theme.textMain}>{bestSetorRecent.name}</strong> segue como o principal motor de receita, liderando o faturamento absoluto.
                  </li>
                )}

                {!filter.setor && bestSetorRecent && topGrowthSetor && bestSetorRecent.name === topGrowthSetor.name && (
                  <li>
                    Além do crescimento, <strong className={theme.textMain}>{bestSetorRecent.name}</strong> segue como o principal motor de receita, liderando o faturamento absoluto.
                  </li>
                )}
                
                {!filter.setor && bottomSetor && bottomSetor.growth < 0 && (
                  <li>
                    O setor <strong className={theme.textMain}>{bottomSetor.name}</strong> apresenta retração de <span style={{color: theme.negative}}>{formatPercent(bottomSetor.growth)}</span>, sendo um ponto de atenção estratégica.
                  </li>
                )}

                {!isLojaSelected && byLojaRecent.length > 0 && (
                  <li>
                    A loja líder em faturamento é <strong className={theme.textMain}>{byLojaRecent[0].name}</strong>, com {formatCurrency(byLojaRecent[0].value)}.
                  </li>
                )}

                {!isLojaSelected && topGrowthLoja && topGrowthLoja.growth > 0 && (
                  <li>
                    Já o maior crescimento entre lojas ocorre em <strong className={theme.textMain}>{topGrowthLoja.name}</strong> (<span style={{color: theme.positive}}>{formatPercent(topGrowthLoja.growth)}</span>), indicando potencial de expansão.
                  </li>
                )}

                {!isLojaSelected && bottomLojas.length > 0 && (
                  <li>
                    Atenção: <strong className={theme.textMain}>{bottomLojas.length} loja{bottomLojas.length > 1 ? 's' : ''}</strong> apresenta{bottomLojas.length > 1 ? 'm' : ''} queda, com destaque negativo para <strong className={theme.textMain}>{bottomLojas[0].name}</strong> (<span style={{color: theme.negative}}>{formatPercent(bottomLojas[0].growth)}</span>), sugerindo necessidade de investigação.
                  </li>
                )}
              </ul>
            </div>
         </div>

        {/* Análise Temporal (Anual) */}
        {type === 'anual' && (
          <div className="grid grid-cols-1 gap-6">
            <ChartCard title="Evolução Mensal (2025 vs 2026)" theme={theme}>
              <div className="flex gap-2 mb-4 justify-end border-b pb-2" style={{ borderColor: theme.gridLine }}>
                <button 
                  onClick={() => setLineChartMode('faturamento')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${lineChartMode === 'faturamento' ? 'bg-blue-500 text-white' : theme.textMuted}`}
                >
                  Faturamento
                </button>
                <button 
                  onClick={() => setLineChartMode('crescimento')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${lineChartMode === 'crescimento' ? 'bg-emerald-500 text-white' : theme.textMuted}`}
                >
                  Crescimento (%)
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                {lineChartMode === 'faturamento' ? (
                  <LineChart data={yoyMensal} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.gridLine} />
                    <XAxis dataKey="name" tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} tickFormatter={(val) => String(val).toUpperCase()} />
                    <YAxis tickFormatter={(val) => `R$ ${val/1000}k`} tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: theme.chartCursor}} content={<CustomTooltip />} />
                    <Legend wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                    <Line type="monotone" dataKey="v25" name="2025" stroke={theme.bar2025} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="v26" name="2026" stroke={theme.bar2026} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  </LineChart>
                ) : (
                  <LineChart data={yoyMensal} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.gridLine} />
                    <XAxis dataKey="name" tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} tickFormatter={(val) => String(val).toUpperCase()} />
                    <YAxis tickFormatter={(val) => `${(val*100).toFixed(0)}%`} tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: theme.chartCursor}} content={<CustomTooltip hideDifference={true} />} />
                    <Legend wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                    <Line type="monotone" dataKey="growth" name="Crescimento (YoY)" stroke={theme.positive} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}}>
                      <LabelList
                        dataKey="growth"
                        content={(props: any) => {
                          const { x, y, value } = props;
                          const color = value > 0 ? theme.positive : value < 0 ? theme.negative : theme.neutral;
                          const formatted = formatPercent(value);
                          return (
                            <text x={x} y={y} dy={-10} fill={color} fontSize={10} fontWeight="bold" textAnchor="middle">
                              {formatted}
                            </text>
                          );
                        }}
                      />
                    </Line>
                  </LineChart>
                )}
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Charts Row 1: Visão Regional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title={`Participação por Cidade (${latestYear})`} theme={theme}>
             <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  onClick={(data: any) => toggleFilter('cidade', data?.name || data?.payload?.name)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                  data={byCidadeRecent}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent, cx, cy, midAngle, outerRadius }) => {
                    const MathPI = Math.PI;
                    const RADIAN = MathPI / 180;
                    const radius = outerRadius * 1.1;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill={theme.chartTick} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="600">
                        {`${String(name).toUpperCase()} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  labelLine={false}
                  stroke={isDarkMode ? "#1F2937" : "#FFFFFF"}
                >
                  {byCidadeRecent.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Crescimento % por Cidade (YoY)" theme={theme}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yoyCidade} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.gridLine} />
                <XAxis dataKey="name" tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} tickFormatter={(val) => String(val).toUpperCase()} />
                <YAxis tickFormatter={(val) => `${(val*100).toFixed(0)}%`} tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: theme.chartCursor}} content={<CustomTooltip />} />
                <Bar dataKey="growth" name="Crescimento" radius={[2, 2, 0, 0]} onClick={(data: any) => toggleFilter('cidade', data?.name || data?.payload?.name)} style={{ cursor: 'pointer' }}>
                  {yoyCidade.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.growth > 0 ? theme.positive : entry.growth < 0 ? theme.negative : theme.neutral} />
                  ))}
                  <LabelList
                    dataKey="growth"
                    content={(props: any) => {
                      const { x, y, width, height, value } = props;
                      const color = value > 0 ? theme.positive : value < 0 ? theme.negative : theme.neutral;
                      const formatted = formatPercent(value);
                      const xPos = x + (width || 0) / 2;
                      const yPos = value >= 0 ? y - 5 : y + height + 12;
                      return (
                        <text x={xPos} y={yPos} fill={color} fontSize={10} fontWeight="bold" textAnchor="middle">
                          {formatted}
                        </text>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2: Visão de Setor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Faturamento: 2025 vs 2026 por Setor" theme={theme}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yoySetor} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.gridLine} />
                <XAxis dataKey="name" tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} tickFormatter={(val) => String(val).toUpperCase()} />
                <YAxis tickFormatter={(val) => `R$ ${val/1000}k`} tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: theme.chartCursor}} content={<CustomTooltip />} />
                <Legend wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                <Bar dataKey="v25" name="2025" fill={theme.bar2025} radius={[2, 2, 0, 0]} onClick={(data: any) => toggleFilter('setor', data?.name || data?.payload?.name)} style={{ cursor: 'pointer' }} />
                <Bar dataKey="v26" name="2026" radius={[2, 2, 0, 0]} onClick={(data: any) => toggleFilter('setor', data?.name || data?.payload?.name)} style={{ cursor: 'pointer' }}>
                   {yoySetor.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

           <ChartCard title="Crescimento % por Setor (YoY)" theme={theme}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yoySetor} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.gridLine} />
                <XAxis type="number" tickFormatter={(val) => `${(val*100).toFixed(0)}%`} tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={({y, payload}) => (
                  <text x={10} y={y} dy={4} textAnchor="start" fill={theme.chartTick} fontSize={10} fontWeight="600">{String(payload.value).toUpperCase()}</text>
                )} />
                <Tooltip cursor={{fill: theme.chartCursor}} content={<CustomTooltip />} />
                <Bar dataKey="growth" name="Crescimento" radius={[0, 2, 2, 0]} onClick={(data: any) => toggleFilter('setor', data?.name || data?.payload?.name)} style={{ cursor: 'pointer' }}>
                   {yoySetor.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.growth > 0 ? theme.positive : entry.growth < 0 ? theme.negative : theme.neutral} />
                  ))}
                  <LabelList
                    dataKey="growth"
                    content={(props: any) => {
                      const { x, y, width, height, value } = props;
                      const color = value > 0 ? theme.positive : value < 0 ? theme.negative : theme.neutral;
                      const formatted = formatPercent(value);
                      const tip = x + (width || 0);
                      const finalX = value >= 0 ? tip + 5 : tip - 5;
                      const align = value >= 0 ? "start" : "end";
                      return (
                        <text x={finalX} y={y + (height || 0) / 2} dy={3} fill={color} fontSize={10} fontWeight="bold" textAnchor={align}>
                          {formatted}
                        </text>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 3: Visão Operacional (Lojas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title={`Ranking das Lojas (${latestYear})`} theme={theme}>
             <div className="h-[300px] overflow-y-auto pr-4">
                <ResponsiveContainer width="100%" height={Math.max(300, byLojaRecent.length * 40)}>
                  <BarChart data={byLojaRecent} layout="vertical" margin={{ top: 20, right: 30, left: 160, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.gridLine} />
                    <XAxis type="number" tickFormatter={(val) => `R$ ${val/1000}k`} tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={160} interval={0} axisLine={false} tickLine={false} tick={({y, payload, index}) => (
                      <text x={10} y={y} dy={4} textAnchor="start" fill={theme.chartTick} fontSize={10} fontWeight="600">{`${index + 1}º ${String(payload.value).toUpperCase()}`}</text>
                    )} />
                    <Tooltip cursor={{fill: theme.chartCursor}} content={<CustomTooltip hideDifference={true} />} />
                    <Bar dataKey="value" name="Faturamento" radius={[0, 2, 2, 0]} barSize={20} onClick={(data: any) => toggleFilter('loja', data?.name || data?.payload?.name)} style={{ cursor: 'pointer' }}>
                       {byLojaRecent.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                      <LabelList dataKey="value" position="right" formatter={(val: number) => formatCurrency(val)} fill={theme.chartTick} fontSize={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
          </ChartCard>

          <ChartCard title={`Comparativo de Vendas Lojas ${filter.ano ? `(${filter.ano})` : ''}`} theme={theme}>
            <div className="h-[300px] overflow-y-auto pr-4">
              <ResponsiveContainer width="100%" height={Math.max(300, salesLoja.length * 60)}>
                <BarChart data={salesLoja} layout="vertical" margin={{ top: 20, right: 30, left: 160, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.gridLine} />
                  <XAxis type="number" tickFormatter={(val) => `R$ ${val/1000}k`} tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={160} interval={0} axisLine={false} tickLine={false} tick={({y, payload}) => (
                    <text x={10} y={y} dy={4} textAnchor="start" fill={theme.chartTick} fontSize={10} fontWeight="600">{String(payload.value).toUpperCase()}</text>
                  )} />
                  <Tooltip cursor={{fill: theme.chartCursor}} content={<CustomTooltip />} />
                  <Legend wrapperStyle={{paddingTop: '10px', fontSize: '12px'}}/>
                  <Bar dataKey="v25" name="2025" fill={theme.bar2025} radius={[0, 2, 2, 0]} barSize={12} onClick={(data: any) => toggleFilter('loja', data?.name || data?.payload?.name)} style={{ cursor: 'pointer' }} />
                  <Bar dataKey="v26" name="2026" fill={theme.bar2026} radius={[0, 2, 2, 0]} barSize={12} onClick={(data: any) => toggleFilter('loja', data?.name || data?.payload?.name)} style={{ cursor: 'pointer' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Charts Row 4: Visão Operacional (Crescimento de Lojas) */}
        <div className="grid grid-cols-1 gap-6">
             <ChartCard title="Crescimento % por Loja (2025 vs 2026)" theme={theme}>
              <div className="h-[400px] overflow-auto pr-4">
                <ResponsiveContainer width="100%" height={Math.max(400, yoyLoja.length * 40)}>
                  <BarChart data={yoyLoja} layout="vertical" margin={{ top: 20, right: 30, left: 160, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.gridLine} />
                    <XAxis type="number" tickFormatter={(val) => `${(val*100).toFixed(0)}%`} tick={{fill: theme.chartTick, fontSize: 10, fontWeight: "600"}} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={160} interval={0} axisLine={false} tickLine={false} tick={({y, payload}) => (
                      <text x={10} y={y} dy={4} textAnchor="start" fill={theme.chartTick} fontSize={10} fontWeight="600">{String(payload.value).toUpperCase()}</text>
                    )} />
                    <Tooltip cursor={{fill: theme.chartCursor}} content={<CustomTooltip />} />
                    <Bar dataKey="growth" name="Crescimento" radius={[0, 2, 2, 0]} barSize={20} onClick={(data: any) => toggleFilter('loja', data?.name || data?.payload?.name)} style={{ cursor: 'pointer' }}>
                      {yoyLoja.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.growth > 0 ? theme.positive : entry.growth < 0 ? theme.negative : theme.neutral} />
                      ))}
                      <LabelList
                        dataKey="growth"
                        content={(props: any) => {
                          const { x, y, width, height, value } = props;
                          const color = value > 0 ? theme.positive : value < 0 ? theme.negative : theme.neutral;
                          const formatted = formatPercent(value);
                          const tip = x + (width || 0);
                          const finalX = value >= 0 ? tip + 5 : tip - 5;
                          const align = value >= 0 ? "start" : "end";
                          return (
                            <text x={finalX} y={y + (height || 0) / 2} dy={3} fill={color} fontSize={10} fontWeight="bold" textAnchor={align}>
                              {formatted}
                            </text>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, theme }: { title: string, value: string | React.ReactNode, icon: React.ReactNode, theme: any }) {
  return (
    <div className={`${theme.bgCard} p-4 rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between transition-colors`}>
       <div className="flex justify-between items-start mb-4">
         <span className={`text-[10px] uppercase font-bold ${theme.textMuted}`}>{title}</span>
         <div className={`p-2 rounded-lg opacity-80`} style={{ backgroundColor: theme.gridLine }}>{icon}</div>
       </div>
       <p className={`text-2xl font-light ${theme.textMain} tracking-tight`}>{value}</p>
    </div>
  )
}

function ChartCard({ title, children, theme }: { title: string, children: React.ReactNode, theme: any }) {
  return (
    <div className={`${theme.bgCard} p-5 rounded-xl border shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col transition-colors`}>
       <h3 className={`text-[12px] font-bold ${theme.textChartTitle} uppercase mb-6 tracking-wide`}>{String(title).toUpperCase()}</h3>
       <div className="flex-1 w-full">
         {children}
       </div>
    </div>
  )
}
