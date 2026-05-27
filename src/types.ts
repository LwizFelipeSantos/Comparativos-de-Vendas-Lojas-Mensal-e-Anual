export interface SalesRawData {
  Unidade: string | number;
  LOJA: string;
  CIDADE: string;
  SETOR: string;
  ANO: number;
  Valor: number;
}

export interface SalesData {
  unidade: string;
  loja: string;
  cidade: string;
  setor: string;
  ano: number;
  mes?: number | string;
  valor: number;
}

export type FilterState = {
  cidade: string | null;
  loja: string | null;
  setor: string | null;
  ano: number | null;
  mes: string | number | null;
};
