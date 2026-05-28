import { useState, useEffect } from "react";
import { FileUpload } from "./components/Upload";
import { Dashboard } from "./components/Dashboard";
import { SalesData } from "./types";
import { Loader2, AlertCircle } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { db, auth, provider } from "./lib/firebase";

export default function App() {
  const [dataMensal, setDataMensal] = useState<SalesData[]>([]);
  const [periodMensal, setPeriodMensal] = useState<string>("");
  const [dataAnual, setDataAnual] = useState<SalesData[]>([]);
  const [periodAnual, setPeriodAnual] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'mensal' | 'anual'>('mensal');
  const [user, setUser] = useState<User | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const fetchData = async () => {
      try {
        const [resMensal, resAnual] = await Promise.all([
          getDoc(doc(db, 'sales', 'mensal')),
          getDoc(doc(db, 'sales', 'anual'))
        ]);

        if (resMensal.exists()) {
          const docData = resMensal.data();
          if (docData.data) setDataMensal(JSON.parse(docData.data));
          if (docData.period) setPeriodMensal(docData.period || "");
        }
        
        if (resAnual.exists()) {
           const docData = resAnual.data();
           if (docData.data) setDataAnual(JSON.parse(docData.data));
           if (docData.period) setPeriodAnual(docData.period || "");
        }
      } catch (err) {
        console.error("Erro ao puxar os dados", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => unsubscribe();
  }, []);

  const handleDataReady = (newData: SalesData[], newPeriod: string, type: 'mensal' | 'anual') => {
    if (type === 'mensal') {
      setDataMensal(newData);
      setPeriodMensal(newPeriod);
    } else {
      setDataAnual(newData);
      setPeriodAnual(newPeriod);
    }
    setShowUpload(false);
  };

  const handleReset = async () => {
    setShowUpload(true);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
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
  const isAdmin = user?.email?.toLowerCase() === 'luizfelipengl@gmail.com';

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <div className="w-full bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 py-2 no-print">
        <div className="flex items-center space-x-4">
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
        <div>
          {!user ? (
            <button onClick={handleLogin} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
              Entrar como Admin
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-300">Admin: {user.email}</span>
              <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white transition-colors underline">Sair</button>
            </div>
          )}
        </div>
      </div>

      {!showUpload && currentData.length > 0 ? (
        <Dashboard 
          data={currentData} 
          period={currentPeriod} 
          onReset={isAdmin ? handleReset : undefined} 
          type={currentTab} 
          title={currentTab === 'mensal' ? 'Comparativo de Vendas Mensal' : 'Comparativo de Vendas Anual'}
        />
      ) : (
        <div className="p-4 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
          {isAdmin ? (
            <div className="w-full max-w-xl">
              {currentData.length > 0 && (
                <button onClick={() => setShowUpload(false)} className="mb-4 text-blue-600 font-medium hover:underline">
                  &lt; Voltar para o Dashboard
                </button>
              )}
              <FileUpload onDataReady={(data, period) => handleDataReady(data, period, currentTab)} type={currentTab} />
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-xl border shadow-sm max-w-md">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-700 mb-2">Painel Vazio</h2>
              <p className="text-slate-500 mb-6">Nenhum dado publicado no momento para este comparativo. O administrador precisa fazer o upload dos dados para visualização.</p>
              {!user && (
                <button onClick={handleLogin} className="mt-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors border">
                  Sou Administrador (Login)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
