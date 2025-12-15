import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Building2, Calendar } from 'lucide-react';
import { Imovel, PropertyStatus, PropertyType, FichaStatus } from '../types';
import { propertyService } from '../services/propertyService';

interface FormData {
  codigo: string;
  locador: string; // Alterado
  endereco: string;
  bairro: string;
  tipo: PropertyType;
  valor: number;
  iptu: number;
  seguroIncendio: number;
  descricao: string;
  observacao: string;
  status: PropertyStatus;
  fichaStatus: FichaStatus;
  fichaData: string; 
  captador: string;
  corretor: string;
  vagoEm: string;
  liberadoEm: string;
}

export const PropertyForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      fichaStatus: 'Sem ficha',
      captador: '',
      corretor: '',
      locador: '',
      iptu: 0,
      seguroIncendio: 0
    }
  });

  const selectedFichaStatus = watch('fichaStatus');
  const [showFichaDate, setShowFichaDate] = useState(false);

  useEffect(() => {
    setShowFichaDate(selectedFichaStatus === 'Com ficha');
  }, [selectedFichaStatus]);

  useEffect(() => {
    if (id) {
      const unsubscribe = propertyService.subscribeToProperties((properties) => {
        const found = properties.find(p => p.id === id);
        if (found) {
          setValue('codigo', found.codigo);
          setValue('locador', found.locador || '');
          setValue('endereco', found.endereco);
          setValue('bairro', found.bairro);
          setValue('tipo', found.tipo);
          setValue('valor', found.valor);
          setValue('iptu', found.iptu || 0);
          setValue('seguroIncendio', found.seguroIncendio || 0);
          setValue('descricao', found.descricao);
          setValue('observacao', found.observacao || '');
          setValue('status', found.status);
          setValue('fichaStatus', found.fichaStatus || 'Sem ficha');
          setValue('captador', found.captador || '');
          setValue('corretor', found.corretor || '');
          
          if (found.vagoEm) {
            const date = new Date(found.vagoEm);
            setValue('vagoEm', date.toISOString().split('T')[0]);
          }

          if (found.liberadoEm) {
            const date = new Date(found.liberadoEm);
            setValue('liberadoEm', date.toISOString().split('T')[0]);
          }

          if (found.fichaDataAtualizacao && found.fichaStatus === 'Com ficha') {
             const date = new Date(found.fichaDataAtualizacao);
             setValue('fichaData', date.toISOString().split('T')[0]);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [id, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        ...data,
        vagoEm: data.vagoEm ? new Date(data.vagoEm).getTime() + 86400000 / 2 : null,
        liberadoEm: data.liberadoEm ? new Date(data.liberadoEm).getTime() + 86400000 / 2 : null,
        fichaDataAtualizacao: data.fichaStatus === 'Com ficha' && data.fichaData 
            ? new Date(data.fichaData).getTime() + 86400000 / 2 
            : null
      };

      // Remove campo auxiliar
      delete payload.fichaData;

      if (id) {
        await propertyService.updateProperty(id, payload);
      } else {
        await propertyService.addProperty({ 
          ...payload, 
          dataAtualizacao: Date.now()
        } as any);
      }
      navigate('/');
    } catch (error: any) {
      console.error("Error saving:", error);
      if (error.code === 'permission-denied') {
        alert("🚨 ERRO DE PERMISSÃO 🚨\n\nNão foi possível salvar o imóvel porque o Firebase bloqueou o acesso.\n\nVerifique as Regras de Segurança no Console do Firebase.");
      } else {
        alert("Erro ao salvar imóvel. Verifique o console.");
      }
    }
  };

  const inputClass = "block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 bg-white text-slate-900 placeholder-slate-400";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-emerald-900 rounded-lg text-white shadow-md">
                         <Building2 className="w-6 h-6" />
                     </div>
                     <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{id ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}</h1>
                </div>
                <button 
                onClick={() => navigate('/')} 
                className="flex items-center text-slate-600 hover:text-emerald-800 hover:bg-white transition-all font-medium text-sm bg-slate-50 px-4 py-2 rounded-lg shadow-sm border border-slate-200"
                >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para lista
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-xl shadow-slate-200/60 rounded-2xl overflow-hidden border border-slate-100">
                <div className="p-8 space-y-10">
                
                {/* Section 1: Dados do Imóvel */}
                <div>
                    <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-100 pb-2 mb-6 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                        Dados Principais & Valores
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                            <input 
                            type="text" 
                            {...register('codigo', { required: 'Código é obrigatório' })}
                            className={inputClass}
                            placeholder="Ex: AP-100"
                            />
                            {errors.codigo && <span className="text-red-500 text-xs mt-1">{errors.codigo.message}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select 
                            {...register('tipo')}
                            className={inputClass}
                            >
                            <option value="Casa">Casa</option>
                            <option value="Apartamento">Apartamento</option>
                            <option value="Kitnet">Kitnet</option>
                            <option value="Sala">Sala Comercial</option>
                            <option value="Loja">Loja</option>
                            <option value="Comercial">Imóvel Comercial</option>
                            <option value="Garagem">Garagem</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status Atual</label>
                            <select 
                            {...register('status')}
                            className={inputClass}
                            >
                            <option value="Disponível">Disponível</option>
                            <option value="Em processo de locação">Em processo de locação</option>
                            <option value="Desocupando">Desocupando</option>
                            <option value="Suspenso">Suspenso</option>
                            <option value="Locado">Locado</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Mensal (R$)</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                                <span className="text-slate-500 sm:text-sm">R$</span>
                                </div>
                                <input 
                                type="number" 
                                step="0.01"
                                {...register('valor', { required: 'Valor é obrigatório', min: 0 })}
                                className={`${inputClass} pl-10`}
                                placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">IPTU (Anual)</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                                <span className="text-slate-500 sm:text-sm">R$</span>
                                </div>
                                <input 
                                type="number" 
                                step="0.01"
                                {...register('iptu')}
                                className={`${inputClass} pl-10`}
                                placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SI (Anual)</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                                <span className="text-slate-500 sm:text-sm">R$</span>
                                </div>
                                <input 
                                type="number" 
                                step="0.01"
                                {...register('seguroIncendio')}
                                className={`${inputClass} pl-10`}
                                placeholder="0,00"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Responsáveis */}
                <div>
                    <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-100 pb-2 mb-6 flex items-center">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                        Responsáveis
                    </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Locador</label>
                            <input 
                            type="text" 
                            {...register('locador')}
                            placeholder="Nome ou código do proprietário"
                            className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Captador</label>
                            <input 
                            type="text" 
                            {...register('captador', { required: 'Captador é obrigatório' })}
                            placeholder="Nome do captador"
                            className={inputClass}
                            />
                            {errors.captador && <span className="text-red-500 text-xs mt-1">{errors.captador.message}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Corretor</label>
                            <input 
                            type="text" 
                            {...register('corretor')}
                            placeholder="Nome do corretor (opcional)"
                            className={inputClass}
                            />
                        </div>
                     </div>
                </div>

                {/* Section 3: Localização */}
                <div>
                    <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-100 pb-2 mb-6 flex items-center">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                        Localização
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                            <input 
                            type="text" 
                            {...register('endereco', { required: 'Endereço é obrigatório' })}
                            className={inputClass}
                            placeholder="Logradouro, número, complemento"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                            <input 
                            type="text" 
                            {...register('bairro', { required: 'Bairro é obrigatório' })}
                            className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 4: Informações adicionais */}
                <div>
                    <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-100 pb-2 mb-6 flex items-center">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                        Detalhes do Imóvel
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Detalhada</label>
                            <textarea 
                            rows={3}
                            {...register('descricao')}
                            placeholder="Descreva os diferenciais do imóvel, quantidade de quartos, vagas, lazer..."
                            className={inputClass}
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Observações Internas</label>
                            <textarea 
                            rows={2}
                            {...register('observacao')}
                            placeholder="Informações extras, avisos sobre chaves, horários, etc. (Não visível em anúncios externos)"
                            className={inputClass}
                            />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <label className="block text-sm font-medium text-slate-900 mb-1">Situação do Imóvel</label>
                            <select 
                                {...register('fichaStatus')}
                                className={`${inputClass} mb-2`}
                            >
                                <option value="Sem ficha">Sem ficha</option>
                                <option value="Com ficha">Com ficha</option>
                            </select>
                            
                            {showFichaDate && (
                                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-xs font-bold text-emerald-700 mb-1 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Data da Ficha
                                    </label>
                                    <input 
                                        type="date"
                                        {...register('fichaData')}
                                        className={inputClass}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <label className="block text-sm font-medium text-slate-900 mb-1">Liberado em</label>
                            <input 
                                type="date"
                                {...register('liberadoEm')}
                                className={inputClass}
                            />
                            <p className="mt-2 text-xs text-slate-500">Data de início da disponibilidade.</p>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <label className="block text-sm font-medium text-slate-900 mb-1">Previsão de Desocupação</label>
                            <input 
                                type="date"
                                {...register('vagoEm')}
                                className={inputClass}
                            />
                            <p className="mt-2 text-xs text-slate-500">Opcional. Se estiver saindo.</p>
                        </div>

                    </div>
                </div>

                </div>
                <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                </div>
            </form>
        </div>
    </div>
  );
};