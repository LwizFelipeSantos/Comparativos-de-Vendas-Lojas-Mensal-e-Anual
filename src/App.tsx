import { useState, useEffect } from "react";
import { FileUpload } from "./components/Upload";
import { Dashboard } from "./components/Dashboard";
import { SalesData } from "./types";
import { Loader2 } from "lucide-react";

export default function App() {
  const [dataMensal, setDataMensal] = useState<SalesData[]>([]);
  const [periodMensal, setPeriodMensal] = useState<string>("");
  const [dataAnual, setDataAnual] = useState<SalesData[]>([]);
  const [periodAnual, setPeriodAnual] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'mensal' | 'anual'>('mensal');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resMensal, resAnual] = await Promise.all([
          fetch("/api/data?type=mensal"),
          fetch("/api/data?type=anual")
        ]);
        const [jsonMensal, jsonAnual] = await Promise.all([
          resMensal.json(),
          resAnual.json()
        ]);

        if (jsonMensal && jsonMensal.data) {
          setDataMensal(jsonMensal.data);
          setPeriodMensal(jsonMensal.period || "");
        }
        if (jsonAnual && jsonAnual.data) {
          setDataAnual(jsonAnual.data);
          setPeriodAnual(jsonAnual.period || "");
        }
      } catch (err) {
        console.error("Erro ao puxar os dados", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDataReady = (newData: SalesData[], newPeriod: string, type: 'mensal' | 'anual') => {
    if (type === 'mensal') {
      setDataMensal(newData);
      setPeriodMensal(newPeriod);
    } else {
      setDataAnual(newData);
      setPeriodAnual(newPeriod);
    }
  };

  const handleReset = async (type: 'mensal' | 'anual') => {
    if (type === 'mensal') {
      setDataMensal([]);
    } else {
      setDataAnual([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const currentData = currentTab === 'mensal' ? dataMensal : dataAnual;
  const currentPeriod = currentTab === 'mensal' ? periodMensal : periodAnual;

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <div className="w-full bg-slate-900 border-b border-slate-800 flex items-center justify-center space-x-4 p-2 no-print">
        <button 
          onClick={() => setCurrentTab('mensal')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${currentTab === 'mensal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Comparativo Mensal
        </button>
        <button 
          onClick={() => setCurrentTab('anual')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${currentTab === 'anual' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Comparativo Anual
        </button>
      </div>

      {currentData.length > 0 ? (
        <Dashboard 
          data={currentData} 
          period={currentPeriod} 
          onReset={() => handleReset(currentTab)} 
          type={currentTab} 
          title={currentTab === 'mensal' ? 'Comparativo de Vendas Mensal' : 'Comparativo de Vendas Anual'}
        />
      ) : (
        <div className="p-4 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <FileUpload onDataReady={(data, period) => handleDataReady(data, period, currentTab)} type={currentTab} />
        </div>
      )}
    </div>
  );
}
