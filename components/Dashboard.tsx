import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, ArrowUpDown, MoreHorizontal, 
  Edit, Trash2, CheckCircle, Clock, PauseCircle, LogOut,
  FileText, ClipboardCheck, RotateCcw, Download, Building2, Key, ChevronDown, Home, Briefcase,
  DollarSign, TrendingUp, X, MapPin, LayoutDashboard, List, FileX, FileCheck
} from 'lucide-react';
import { propertyService } from '../services/propertyService';
import { Imovel, PropertyStatus, DashboardStats, FichaStatus } from '../types';
import { StatusBadge } from './StatusBadge';

// Definitions for categories
const CATEGORIA_RESIDENCIAL = ['Casa', 'Apartamento', 'Kitnet'];
const CATEGORIA_COMERCIAL = ['Sala', 'Loja', 'Comercial', 'Garagem'];

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  onClick?: () => void;
  isActive?: boolean;
  highlight?: boolean;
  compact?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, colorClass, bgClass, onClick, isActive, highlight, compact }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative rounded-xl border transition-all duration-200 cursor-pointer group hover:shadow-md 
        ${isActive ? 'ring-2 ring-emerald-500 ring-offset-1' : ''} 
        ${bgClass} 
        ${highlight ? 'shadow-sm' : ''}
        ${compact ? 'p-2' : 'p-4'}
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'}`}>{label}</span>
        <div className={`p-1 rounded-lg ${isActive ? 'bg-white shadow-sm' : 'bg-white/50 group-hover:bg-white group-hover:shadow-sm'} transition-all ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col">
        <span className={`font-bold tracking-tight ${compact ? 'text-lg' : 'text-2xl'} ${colorClass}`}>{value}</span>
        {subValue && <span className="text-[9px] text-slate-400 font-medium leading-tight">{subValue}</span>}
      </div>
    </div>
  );
};

interface SortableHeaderProps {
  label: string;
  field: keyof Imovel;
  currentSort: keyof Imovel;
  currentDirection: 'asc' | 'desc';
  onSort: (field: keyof Imovel) => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, field, currentSort, currentDirection, onSort, className }) => {
  return (
    <th 
      scope="col" 
      className={`px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 hover:text-emerald-700 transition-colors group select-none ${className || ''}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={`transition-opacity ${currentSort === field ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
          <ArrowUpDown className={`w-3 h-3 ${currentSort === field && currentDirection === 'asc' ? 'rotate-180' : ''} transition-transform`} />
        </span>
      </div>
    </th>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
    >
      <div className="mr-3 p-1 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all">
        {icon}
      </div>
      {label}
    </button>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Imovel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'financial'>('list');
  
  // Filtering States
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [bairroFilter, setBairroFilter] = useState<string>('');

  const [sortField, setSortField] = useState<keyof Imovel>('dataAtualizacao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  
  // State for the custom status filter dropdown
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = propertyService.subscribeToProperties((data) => {
      setProperties(data);
    });
    return () => unsubscribe();
  }, []);

  // Calculate Stats
  const stats: DashboardStats = useMemo(() => {
    return properties.reduce((acc, curr) => {
      acc.total++;
      
      const valor = Number(curr.valor) || 0;

      // Category Stats
      if (CATEGORIA_RESIDENCIAL.includes(curr.tipo)) acc.residencial++;
      if (CATEGORIA_COMERCIAL.includes(curr.tipo)) acc.comercial++;

      // Status Stats & Financials
      if (curr.status === 'Disponível') {
        acc.disponivel++;
        acc.potencialReceita += valor;
      }
      if (curr.status === 'Em processo de locação') {
        acc.emProcesso++;
        acc.potencialReceita += valor; // Still potential
      }
      if (curr.status === 'Desocupando') {
        acc.desocupando++;
        acc.receitaMensal += valor; // Still paying
      }
      if (curr.status === 'Suspenso') acc.suspenso++;
      if (curr.status === 'Locado') {
        acc.locado++;
        acc.receitaMensal += valor;
      }
      
      return acc;
    }, { 
      total: 0, residencial: 0, comercial: 0, 
      disponivel: 0, emProcesso: 0, desocupando: 0, suspenso: 0, locado: 0,
      receitaMensal: 0, potencialReceita: 0
    });
  }, [properties]);

  // Filtering & Sorting
  const filteredProperties = useMemo(() => {
    return properties
      .filter(p => {
        // Multi-field Text Search
        const searchLower = searchTerm.toLowerCase();
        // Split by space to get individual terms (e.g. "Centro Joao" -> ["centro", "joao"])
        const searchTerms = searchLower.split(/\s+/).filter(t => t.length > 0);
        
        // Every term must be present in at least one of the fields (AND logic for terms, OR logic for fields)
        const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => {
             return (
                p.codigo.toLowerCase().includes(term) ||
                (p.locador && p.locador.toLowerCase().includes(term)) ||
                p.endereco.toLowerCase().includes(term) ||
                p.bairro.toLowerCase().includes(term) ||
                (p.captador && p.captador.toLowerCase().includes(term)) ||
                (p.descricao && p.descricao.toLowerCase().includes(term)) ||
                (p.observacao && p.observacao.toLowerCase().includes(term))
             );
        });
        
        // Status Filter
        const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;

        // Category Filter
        let matchesCategory = true;
        if (categoryFilter === 'Residencial') {
            matchesCategory = CATEGORIA_RESIDENCIAL.includes(p.tipo);
        } else if (categoryFilter === 'Comercial') {
            matchesCategory = CATEGORIA_COMERCIAL.includes(p.tipo);
        }
        
        // Bairro Filter
        const matchesBairro = p.bairro.toLowerCase().includes(bairroFilter.toLowerCase());

        return matchesSearch && matchesStatus && matchesCategory && matchesBairro;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (aValue === bValue) return 0;
        
        // Handle undefined or null values safely
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [properties, searchTerm, statusFilter, categoryFilter, sortField, sortDirection, bairroFilter]);

  // Actions
  const handleSort = (field: keyof Imovel) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: PropertyStatus) => {
    setActiveActionMenu(null);
    try {
        await propertyService.updateProperty(id, { status: newStatus });
    } catch (error: any) {
        console.error(error);
        if (error.code === 'permission-denied') alert("Acesso negado. Configure as regras do Firebase.");
        else alert("Erro ao atualizar status.");
    }
  };

  const handleFichaUpdate = async (id: string, newFichaStatus: FichaStatus) => {
    setActiveActionMenu(null);
    try {
        await propertyService.updateProperty(id, { 
        fichaStatus: newFichaStatus,
        fichaDataAtualizacao: Date.now()
        });
        
        if (newFichaStatus === 'Em andamento') {
        alert('Ficha marcada como em análise.');
        } else if (newFichaStatus === 'Aprovada') {
        alert('Ficha aprovada!');
        }
    } catch (error: any) {
        console.error(error);
        if (error.code === 'permission-denied') alert("Acesso negado. Configure as regras do Firebase.");
        else alert("Erro ao atualizar ficha.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este imóvel?")) {
      setActiveActionMenu(null);
      try {
        await propertyService.deleteProperty(id);
      } catch (error: any) {
        console.error(error);
        if (error.code === 'permission-denied') alert("Acesso negado. Configure as regras do Firebase.");
        else alert("Erro ao excluir imóvel.");
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("ATENÇÃO: Isso apagará TODOS os imóveis da lista.\n\nDeseja continuar?")) {
      try {
        await propertyService.clearAll();
      } catch (error: any) {
        console.error(error);
        if (error.code === 'permission-denied') alert("Acesso negado. Configure as regras do Firebase.");
        else alert("Erro ao limpar dados.");
      }
    }
  };

  const handleRestore = async () => {
    if (window.confirm("Isso irá restaurar os dados de exemplo e apagar as alterações atuais. Deseja continuar?")) {
      await propertyService.restoreDefaults();
    }
  };

  const handleExportCSV = () => {
    if (filteredProperties.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const headers = ["LD", "Bairro", "Tipo", "Descrição", "Endereço", "Valor", "IPTU", "Seg. Incêndio", "Código", "Observação", "Ficha", "Status", "Data Atualização"];
    
    const rows = filteredProperties.map(p => [
      p.locador || '',
      p.bairro,
      p.tipo,
      `"${(p.descricao || '').replace(/"/g, '""')}"`,
      p.endereco,
      p.valor.toString().replace('.', ','),
      (p.iptu || 0).toString().replace('.', ','),
      (p.seguroIncendio || 0).toString().replace('.', ','),
      p.codigo,
      `"${(p.observacao || '').replace(/"/g, '""')}"`,
      p.fichaStatus || 'Sem ficha',
      p.status,
      new Date(p.dataAtualizacao).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `varp_imoveis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      setActiveActionMenu(null);
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };
  
  const formatCurrencyFull = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
  };

  const renderFichaBadge = (status?: FichaStatus) => {
    const s = status || 'Sem ficha';
    let classes = "bg-slate-100 text-slate-500 border-slate-200";
    let dotColor = "bg-slate-400";
    
    if (s === 'Em andamento') { classes = "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20"; dotColor = "bg-amber-500"; }
    if (s === 'Aprovada') { classes = "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20"; dotColor = "bg-emerald-500"; }
    if (s === 'Com ficha') { classes = "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20"; dotColor = "bg-blue-500"; }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${classes}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {s}
      </span>
    );
  };

  // Status Colors for the Filter Dropdown
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponível': return 'bg-emerald-500';
      case 'Em processo de locação': return 'bg-amber-500';
      case 'Desocupando': return 'bg-purple-500';
      case 'Locado': return 'bg-red-500';
      case 'Suspenso': return 'bg-slate-400';
      default: return 'bg-slate-300';
    }
  };

  const toggleStatus = (st: string) => {
      if (statusFilter === st) setStatusFilter('Todos');
      else setStatusFilter(st);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Header - FULL WIDTH */}
      <header className="bg-white border-t-4 border-t-emerald-900 border-b border-b-slate-200 shadow-sm sticky top-0 z-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logotype */}
            <div className="flex flex-col items-start justify-center cursor-pointer" onClick={() => { setStatusFilter('Todos'); setCategoryFilter('Todos'); setSearchTerm(''); setBairroFilter(''); navigate('/'); }}>
                 <div className="text-green-800 font-bold text-xl tracking-tighter leading-none">
                  VARP <span className="text-gray-600 text-xs font-normal tracking-normal">Imóveis</span>
                 </div>
                 <div className="text-[9px] text-yellow-600 font-serif italic">Desde 1978</div>
            </div>
            
            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            
            {/* View Switcher Tabs */}
            <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <List className="w-3.5 h-3.5 mr-1.5" />
                    Imóveis
                </button>
                <button 
                    onClick={() => setViewMode('financial')}
                    className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'financial' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                    Financeiro
                </button>
            </div>
          </div>
          
          {/* Bairro Filter Input in Header */}
          <div className="flex-1 max-w-xs mx-4 hidden md:block relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <input 
                  type="text" 
                  className="block w-full pl-9 pr-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 focus:bg-white transition-all text-xs font-medium"
                  placeholder="Filtrar por bairro..."
                  value={bairroFilter}
                  onChange={(e) => setBairroFilter(e.target.value)}
              />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 mr-2 bg-slate-100 rounded-full p-0.5">
              <button 
                onClick={handleExportCSV}
                title="Exportar CSV"
                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-full transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleRestore}
                title="Restaurar Padrão"
                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-white rounded-full transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleClearAll}
                title="Limpar Tudo"
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded-full transition-all shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button 
              onClick={() => navigate('/novo')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-md text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Novo
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - FULL WIDTH */}
      <main className="w-full px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* VIEW: FINANCIAL DASHBOARD */}
        {viewMode === 'financial' && (
            <div className="fade-in">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <LayoutDashboard className="w-5 h-5 mr-2 text-emerald-700" />
                    Painel Financeiro & Ocupação
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <StatCard 
                        label="Receita Mensal Atual"
                        value={formatCurrency(stats.receitaMensal)}
                        icon={<DollarSign className="w-6 h-6" />}
                        colorClass="text-emerald-700"
                        bgClass="bg-white border-emerald-200"
                        highlight={true}
                    />
                    <StatCard 
                        label="Receita Potencial Total" 
                        value={formatCurrency(stats.potencialReceita)}
                        icon={<TrendingUp className="w-6 h-6" />}
                        colorClass="text-slate-500"
                        bgClass="bg-white border-slate-200"
                    />
                    <StatCard 
                        label="Taxa de Ocupação" 
                        value={`${stats.total > 0 ? Math.round(((stats.locado + stats.desocupando) / stats.total) * 100) : 0}%`}
                        subValue="Imóveis ocupados / Total"
                        icon={<Briefcase className="w-6 h-6" />}
                        colorClass="text-indigo-600"
                        bgClass="bg-white border-indigo-100"
                        highlight={true}
                    />
                </div>
            </div>
        )}

        {/* VIEW: LIST (HOME) */}
        {viewMode === 'list' && (
            <div className="fade-in">
                {/* Compact Status Cards */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
                    <StatCard 
                        label="Total" 
                        value={stats.total} 
                        icon={<Building2 className="w-3 h-3" />}
                        colorClass="text-blue-700"
                        bgClass="bg-white border-slate-200"
                        onClick={() => { setCategoryFilter('Todos'); setStatusFilter('Todos'); }}
                        isActive={statusFilter === 'Todos'}
                        compact={true}
                    />
                    <StatCard 
                        label="Disponíveis" 
                        value={stats.disponivel} 
                        icon={<Key className="w-3 h-3" />}
                        colorClass="text-emerald-600"
                        bgClass="bg-white border-emerald-100"
                        onClick={() => toggleStatus('Disponível')}
                        isActive={statusFilter === 'Disponível'}
                        compact={true}
                    />
                    <StatCard 
                        label="Em Processo" 
                        value={stats.emProcesso} 
                        icon={<Clock className="w-3 h-3" />}
                        colorClass="text-amber-600"
                        bgClass="bg-white border-amber-100"
                        onClick={() => toggleStatus('Em processo de locação')}
                        isActive={statusFilter === 'Em processo de locação'}
                        compact={true}
                    />
                    <StatCard 
                        label="Desocupando" 
                        value={stats.desocupando} 
                        icon={<LogOut className="w-3 h-3" />}
                        colorClass="text-purple-600"
                        bgClass="bg-white border-purple-100"
                        onClick={() => toggleStatus('Desocupando')}
                        isActive={statusFilter === 'Desocupando'}
                        compact={true}
                    />
                    <StatCard 
                        label="Suspensos" 
                        value={stats.suspenso} 
                        icon={<PauseCircle className="w-3 h-3" />}
                        colorClass="text-slate-500"
                        bgClass="bg-slate-50 border-slate-200"
                        onClick={() => toggleStatus('Suspenso')}
                        isActive={statusFilter === 'Suspenso'}
                        compact={true}
                    />
                    <StatCard 
                        label="Locados" 
                        value={stats.locado} 
                        icon={<CheckCircle className="w-3 h-3" />}
                        colorClass="text-red-500"
                        bgClass="bg-white border-red-100"
                        onClick={() => toggleStatus('Locado')}
                        isActive={statusFilter === 'Locado'}
                        compact={true}
                    />
                </div>

                {/* Filters and Controls */}
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 relative z-10">
                <div className="relative flex-1">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                    type="text"
                    className="block w-full pl-9 pr-16 py-2 rounded-lg border-none bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-colors text-xs font-medium"
                    placeholder="Ex: Centro João (Busca múltipla...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {/* Instant Feedback: Result Count & Clear Button */}
                    {searchTerm && (
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm animate-in fade-in duration-200">
                                {filteredProperties.length}
                            </span>
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                                title="Limpar busca"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2 pr-1">
                    
                    {/* Custom Status Dropdown */}
                    <div className="relative" ref={filterRef}>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center justify-between min-w-[180px] bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    >
                        <div className="flex items-center">
                        <Filter className="h-3.5 w-3.5 text-slate-400 mr-2" />
                        <span className="mr-2">Status:</span>
                        {statusFilter !== 'Todos' && (
                            <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(statusFilter)}`}></span>
                        )}
                        <span className="text-slate-900 font-semibold truncate max-w-[100px]">{statusFilter === 'Todos' ? 'Todos' : statusFilter}</span>
                        </div>
                        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isFilterOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="py-1">
                            <button 
                            onClick={() => { setStatusFilter('Todos'); setIsFilterOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-xs flex items-center hover:bg-slate-50 ${statusFilter === 'Todos' ? 'bg-slate-50 text-emerald-700 font-medium' : 'text-slate-700'}`}
                            >
                            <span className="w-2 h-2 rounded-full bg-slate-300 mr-3"></span>
                            Todos os Status
                            </button>
                            <div className="border-t border-slate-50 my-1"></div>
                            {[
                            { label: 'Disponível', color: 'bg-emerald-500' },
                            { label: 'Em processo de locação', color: 'bg-amber-500' },
                            { label: 'Desocupando', color: 'bg-purple-500' },
                            { label: 'Locado', color: 'bg-red-500' },
                            { label: 'Suspenso', color: 'bg-slate-400' }
                            ].map((option) => (
                            <button
                                key={option.label}
                                onClick={() => { setStatusFilter(option.label); setIsFilterOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-xs flex items-center hover:bg-slate-50 ${statusFilter === option.label ? 'bg-emerald-50/50 text-emerald-800 font-medium' : 'text-slate-700'}`}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${option.color} mr-3 shadow-sm`}></span>
                                {option.label}
                            </button>
                            ))}
                        </div>
                        </div>
                    )}
                    </div>

                </div>
                </div>

                {/* Data Table - Modernized */}
                <div className="bg-white shadow-lg shadow-slate-200/50 rounded-2xl overflow-hidden border border-emerald-100">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-emerald-200 table-fixed">
                    <thead className="bg-emerald-50/50">
                        <tr>
                        <SortableHeader className="w-24 whitespace-nowrap" label="LD" field="locador" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableHeader className="w-32 whitespace-nowrap" label="Bairro" field="bairro" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableHeader className="w-24 whitespace-nowrap" label="Tipo" field="tipo" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableHeader className="w-64 whitespace-nowrap" label="Descrição" field="descricao" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableHeader className="w-56 whitespace-nowrap" label="Endereço" field="endereco" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableHeader className="w-32 whitespace-nowrap" label="Valores" field="valor" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableHeader className="w-24 whitespace-nowrap" label="Código" field="codigo" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableHeader className="w-40 whitespace-nowrap" label="Obs" field="observacao" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableHeader className="w-28 whitespace-nowrap" label="Ficha" field="fichaStatus" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableHeader className="w-28 whitespace-nowrap" label="Status" field="status" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableHeader className="w-32 whitespace-nowrap" label="Atualização" field="dataAtualizacao" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                        <th scope="col" className="relative px-6 py-3 w-16">
                            <span className="sr-only">Ações</span>
                        </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-emerald-100">
                        {properties.length === 0 ? (
                        <tr>
                            <td colSpan={11} className="px-6 py-16 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center">
                                <Building2 className="w-12 h-12 mb-4 text-slate-200" />
                                <p className="text-lg font-medium">Nenhum imóvel cadastrado</p>
                                <p className="text-sm mb-4">Comece cadastrando um novo imóvel no sistema.</p>
                                <button 
                                    onClick={() => navigate('/novo')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Cadastrar Imóvel
                                </button>
                            </div>
                            </td>
                        </tr>
                        ) : filteredProperties.length === 0 ? (
                        <tr>
                            <td colSpan={11} className="px-6 py-16 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center">
                                <Search className="w-12 h-12 mb-4 text-slate-200" />
                                <p className="text-lg font-medium">Nenhum imóvel encontrado</p>
                                <p className="text-sm">Tente ajustar seus filtros de busca</p>
                            </div>
                            </td>
                        </tr>
                        ) : (
                        filteredProperties.map((property) => (
                            <tr key={property.id} className="hover:bg-emerald-50/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-bold align-top">
                                <div className="block max-w-[100px] truncate" title={property.locador}>
                                    {property.locador || '-'}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 align-top">
                                <div className="block max-w-[12rem] truncate" title={property.bairro}>
                                {property.bairro || ''}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 align-top">{property.tipo}</td>
                            <td className="px-6 py-4 text-sm text-slate-500 align-top">
                                <div className="block min-w-[200px] whitespace-normal break-words">
                                {property.descricao || ''}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 align-top">
                                <div className="block min-w-[180px] whitespace-normal break-words" title={property.endereco}>
                                {property.endereco || ''}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm align-top bg-emerald-50/30 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="text-emerald-800 font-bold text-sm">
                                    {formatCurrencyFull(property.valor)}
                                    </span>
                                    {(Number(property.iptu) > 0 || Number(property.seguroIncendio) > 0) && (
                                    <div className="mt-1 flex flex-col gap-0.5 border-t border-emerald-100 pt-1">
                                        {Number(property.iptu) > 0 && (
                                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                                            <span className="uppercase tracking-wider mr-1">IPTU</span>
                                            <span className="font-medium">{formatCurrencyFull(property.iptu || 0)}</span>
                                        </div>
                                        )}
                                        {Number(property.seguroIncendio) > 0 && (
                                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                                            <span className="uppercase tracking-wider mr-1">SI</span>
                                            <span className="font-medium">{formatCurrencyFull(property.seguroIncendio || 0)}</span>
                                        </div>
                                        )}
                                    </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 tracking-tight align-top">{property.codigo}</td>
                            <td className="px-6 py-4 text-sm text-slate-500 align-top">
                                <div className="block max-w-[10rem] truncate" title={property.observacao}>
                                {property.observacao || '-'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap align-top">
                                {renderFichaBadge(property.fichaStatus)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap align-top">
                                <StatusBadge status={property.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium align-top">
                                {formatDate(property.dataAtualizacao)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative align-top">
                                <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setActiveActionMenu(activeActionMenu === property.id ? null : property.id)}
                                    className={`p-2 rounded-full transition-colors ${activeActionMenu === property.id ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'}`}
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                
                                {activeActionMenu === property.id && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <button
                                        onClick={() => { navigate(`/editar/${property.id}`); setActiveActionMenu(null); }}
                                        className="group flex w-full items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
                                        >
                                        <Edit className="mr-3 h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
                                        Editar Imóvel
                                        </button>
                                        
                                        <div className="border-t border-slate-100 my-1"></div>
                                        <span className="block px-4 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-bold">Situação da Ficha</span>
                                        <ActionButton 
                                        icon={<FileX className="w-4 h-4 text-slate-400" />} 
                                        label="Sem ficha" 
                                        onClick={() => handleFichaUpdate(property.id, 'Sem ficha')} 
                                        />
                                        <ActionButton 
                                        icon={<FileCheck className="w-4 h-4 text-blue-500" />} 
                                        label="Com ficha" 
                                        onClick={() => handleFichaUpdate(property.id, 'Com ficha')} 
                                        />
                                        <ActionButton 
                                        icon={<FileText className="w-4 h-4 text-amber-500" />} 
                                        label="Em Análise" 
                                        onClick={() => handleFichaUpdate(property.id, 'Em andamento')} 
                                        />
                                        <ActionButton 
                                        icon={<ClipboardCheck className="w-4 h-4 text-emerald-500" />} 
                                        label="Aprovada" 
                                        onClick={() => handleFichaUpdate(property.id, 'Aprovada')} 
                                        />

                                        <div className="border-t border-slate-100 my-1"></div>
                                        <span className="block px-4 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-bold">Alterar Status</span>
                                        <ActionButton icon={<CheckCircle className="w-4 h-4 text-emerald-600" />} label="Disponível" onClick={() => handleQuickStatusChange(property.id, 'Disponível')} />
                                        <ActionButton icon={<Clock className="w-4 h-4 text-amber-500" />} label="Em processo" onClick={() => handleQuickStatusChange(property.id, 'Em processo de locação')} />
                                        <ActionButton icon={<LogOut className="w-4 h-4 text-purple-500" />} label="Desocupando" onClick={() => handleQuickStatusChange(property.id, 'Desocupando')} />
                                        <ActionButton icon={<Building2 className="w-4 h-4 text-red-500" />} label="Locado" onClick={() => handleQuickStatusChange(property.id, 'Locado')} />
                                        <ActionButton icon={<PauseCircle className="w-4 h-4 text-slate-500" />} label="Suspender" onClick={() => handleQuickStatusChange(property.id, 'Suspenso')} />
                                        
                                        <div className="border-t border-slate-100 my-1"></div>
                                        <button
                                        onClick={() => handleDelete(property.id)}
                                        className="group flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                        >
                                        <Trash2 className="mr-3 h-4 w-4 text-red-600 group-hover:text-red-700" />
                                        Excluir
                                        </button>
                                    </div>
                                    </div>
                                )}
                                </div>
                            </td>
                            </tr>
                        ))
                        )}
                    </tbody>
                    </table>
                </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};