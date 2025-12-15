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
  | 'Com ficha'
  | 'Em andamento' 
  | 'Aprovada';

export interface Imovel {
  id: string;
  codigo: string;
  locador?: string; // Alterado de locatario para locador
  endereco: string;
  bairro: string;
  tipo: PropertyType;
  valor: number;
  iptu?: number;
  seguroIncendio?: number;
  descricao: string;
  observacao?: string;
  status: PropertyStatus;
  dataAtualizacao: number;
  fichaStatus?: FichaStatus;
  fichaDataAtualizacao?: number;
  captador: string; 
  corretor?: string;
  vagoEm?: number;
  liberadoEm?: number;
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
  receitaMensal: number;
  potencialReceita: number;
}