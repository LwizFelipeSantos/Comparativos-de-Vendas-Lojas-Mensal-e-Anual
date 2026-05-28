import React, { useCallback, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle, Lock, Calendar } from "lucide-react";
import { SalesData } from "../types";
import { cn } from "../lib/utils";
import { doc, setDoc } from "firebase/firestore";
import { signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { db, auth, provider } from "../lib/firebase";

interface UploadProps {
  onDataReady: (data: SalesData[], period: string) => void;
  type: 'mensal' | 'anual';
}

export function FileUpload({ onDataReady, type }: UploadProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
    }
  };

  const normalizeKey = (key: string) => key.trim().toLowerCase();

  const processFile = async (file: File) => {
    if (!user) {
      setError("Você precisa estar logado como administrador para fazer upload.");
      return;
    }
    if (!period) {
      setError("Informe o período do comparativo.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, string | number>>(
        worksheet
      );

      if (rawJson.length === 0) {
        throw new Error("O arquivo parece estar vazio.");
      }

      const parsedData: SalesData[] = rawJson.map((row) => {
        const normalizedRow: Record<string, string | number> = {};
        for (const [key, value] of Object.entries(row)) {
          normalizedRow[normalizeKey(key)] = value;
        }

        return {
          unidade: String(normalizedRow["unidade"] || ""),
          loja: String(normalizedRow["loja"] || "Desconhecida"),
          cidade: String(normalizedRow["cidade"] || "Desconhecida"),
          setor: String(normalizedRow["setor"] || "Desconhecido"),
          ano: Number(normalizedRow["ano"]) || 0,
          mes: normalizedRow["mês"] || normalizedRow["mes"],
          valor: Number(normalizedRow["valor"]) || 0,
        };
      });

      const validRows = parsedData.filter((d) => d.ano > 0 && d.valor >= 0 && d.loja !== "");
      if (validRows.length === 0) {
        throw new Error("As colunas esperadas não foram encontradas ou os dados são inválidos.");
      }

      await setDoc(doc(db, 'sales', type), {
        data: JSON.stringify(validRows),
        period: period,
        type: type,
      });

      onDataReady(validRows, period);
    } catch (e: any) {
      if (e.code === 'permission-denied') {
         setError("Permissão negada. Você não tem privilégios de administrador.");
      } else {
         setError(e.message || "Erro ao processar o arquivo.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsHovering(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        processFile(droppedFile);
      }
    },
    [user, period]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  if (!user) {
    return (
      <div className="flex w-full max-w-xl mx-auto flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Acesso Restrito</h2>
          <p className="text-slate-500 mt-2">Área designada para upload de dados pelo administrador.</p>
        </div>
        <button onClick={handleLogin} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors">
           Fazer Login com Google
        </button>
        {error && (
          <div className="w-full mt-4 p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-xl mx-auto flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500 mt-2">Área designada para upload de dados pelo administrador.</p>
        <p className="text-xs text-slate-400 mt-1">Logado como: {user.email}</p>
      </div>

      <div className="w-full mb-6 space-y-4">
         <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Período do Comparativo</label>
            <div className="relative">
              <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Ex: Janeiro a Maio de 2026 vs 2025" 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 rounded-lg text-slate-900"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
         </div>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsHovering(true);
        }}
        onDragLeave={() => setIsHovering(false)}
        onDrop={handleDrop}
        className={cn(
          "w-full flex-col flex items-center justify-center border-2 border-dashed rounded-xl p-10 transition-colors duration-200",
          !period ? "opacity-50 cursor-not-allowed border-gray-300 bg-gray-50" : "cursor-pointer border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400",
          isHovering && period ? "border-blue-500 bg-blue-50" : ""
        )}
      >
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          onChange={handleChange}
          disabled={isProcessing || !period}
        />
        {isProcessing ? (
          <div className="flex flex-col items-center text-blue-600">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <span className="font-medium animate-pulse">Lendo e salvando arquivo no Firebase...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-500">
            <FileSpreadsheet className="w-12 h-12 mb-3 text-slate-400" />
            <span className="font-medium text-slate-700">Clique ou arraste a planilha</span>
            <span className="text-sm mt-1">Formato suportado: .xlsx, .xls, .csv</span>
          </div>
        )}
      </label>

      {error && (
        <div className="w-full mt-4 p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
