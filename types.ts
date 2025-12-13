export type PropertyStatus = 
  | 'Disponível' 
  | 'Em processo de locação' 
  | 'Desocupando' 
  | 'Suspenso' 
  | 'Locado';

export type PropertyType = 
  | 'Casa' 
  | 'Apartamento' 
  | 'Sala' 
  | 'Loja'
  | 'Kitnet' 
  | 'Comercial'
  | 'Garagem';

export type FichaStatus = 
  | 'Sem ficha' 
  | 'Em andamento' 
  | 'Aprovada';

export interface Imovel {
  id: string;
  codigo: string;
  endereco: string;
  bairro: string;
  tipo: PropertyType;
  valor: number;
  descricao: string;
  observacao?: string; // Novo campo
  status: PropertyStatus;
  dataAtualizacao: number; // Timestamp
  fichaStatus?: FichaStatus;
  fichaDataAtualizacao?: number; // Timestamp
  captador: string; 
  vagoEm?: number; // Timestamp
  liberadoEm?: number; // Novo campo: Data de liberação
}

export interface DashboardStats {
  total: number;
  residencial: number;
  comercial: number;
  disponivel: number;
  emProcesso: number;
  desocupando: number;
  suspenso: number;
  locado: number;
  // Novos campos financeiros
  receitaMensal: number;
  potencialReceita: number;
}