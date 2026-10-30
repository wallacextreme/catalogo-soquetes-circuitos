// Barra de Filtros Organizada e Sem Barra de Rolagem (Alinhada ao Padrão Ouro de Balcão)
// Linha 4: CATEGORIAS: [Todas] [Placas] [Soquetes] [Subcategorias] | MONTADORA: [Select] ESPECIFICAÇÕES: [Select] [Limpar]

import { FilterState, MacroCategory } from '../types/catalog';
import { icons } from './icons';

export interface FilterCallbacks {
  onMacroChange: (macro: 'all' | MacroCategory) => void;
  onSubCategoryChange?: (sub: string) => void;
  onCategoryPillClick: (macro: 'all' | MacroCategory, sub: string) => void;
  onSpecChange: (specKey: string) => void;
  onMakeChange: (make: string) => void;
  onResetFilters: () => void;
  // Métodos legados mantidos para compatibilidade
  onCircuitSideChange?: (side: 'all' | 'LD' | 'LE' | 'LD/LE (Ambos)') => void;
  onCircuitSystemChange?: (system: 'all' | 'Arteb' | 'Cibié') => void;
  onSocketPolesChange?: (poles: 'all' | 1 | 2) => void;
  onSocketLampChange?: (lamp: 'all' | 'H7' | 'H4' | 'T10' | 'T5' | 'Porcelana' | 'Pino Desencontrado') => void;
}

export function renderFilters(
  container: HTMLElement,
  filters: FilterState,
  counts: { total: number; circuito: number; soquete: number },
  callbacks: FilterCallbacks
): void {
  const isCircuito = filters.macroCategory === 'circuito';
  const isSoquete = filters.macroCategory === 'soquete';
  const isAll = filters.macroCategory === 'all' && (!filters.subCategory || filters.subCategory === 'all');

  const hasActiveFilters =
    filters.macroCategory !== 'all' ||
    (Boolean(filters.subCategory) && filters.subCategory !== 'all') ||
    filters.circuitSide !== 'all' ||
    filters.circuitSystem !== 'all' ||
    filters.socketPoles !== 'all' ||
    filters.socketLamp !== 'all' ||
    (Boolean(filters.make) && filters.make !== 'all');

  // Determina a especificação atualmente ativa para o <select>
  let currentSpecVal = 'all';
  if (filters.circuitSide === 'LD') currentSpecVal = 'side:LD';
  else if (filters.circuitSide === 'LE') currentSpecVal = 'side:LE';
  else if (filters.circuitSide === 'LD/LE (Ambos)') currentSpecVal = 'side:LD/LE (Ambos)';
  else if (filters.circuitSystem === 'Arteb') currentSpecVal = 'sys:Arteb';
  else if (filters.circuitSystem === 'Cibié') currentSpecVal = 'sys:Cibié';
  else if (filters.socketPoles === 1) currentSpecVal = 'poles:1';
  else if (filters.socketPoles === 2) currentSpecVal = 'poles:2';
  else if (filters.socketLamp === 'H7') currentSpecVal = 'lamp:H7';
  else if (filters.socketLamp === 'H4') currentSpecVal = 'lamp:H4';
  else if (filters.socketLamp === 'T10') currentSpecVal = 'lamp:T10';
  else if (filters.socketLamp === 'T5') currentSpecVal = 'lamp:T5';
  else if (filters.socketLamp === 'Porcelana') currentSpecVal = 'lamp:Porcelana';
  else if (filters.socketLamp === 'Pino Desencontrado') currentSpecVal = 'lamp:Pino Desencontrado';

  const activePillCls = 'bg-blue-600 text-white font-bold shadow-sm';
  const inactivePillCls =
    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold border border-slate-200/60 dark:border-slate-700/60';

  container.innerHTML = `
    <div class="w-full pb-3 pt-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- LINHA 4: CATEGORIAS + MONTADORA + ESPECIFICAÇÕES + LIMPAR FILTROS -->
        <div class="flex items-center gap-2 flex-wrap text-xs">
          
          <!-- Rótulo CATEGORIAS -->
          <span class="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
            CATEGORIAS:
          </span>

          <!-- Pills de Categorias (Formato Pílula / Rounded-Full) -->
          <button
            class="pill-category px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
              isAll ? activePillCls : inactivePillCls
            }"
            data-macro="all"
            data-sub="all"
          >
            Todas (${counts.total})
          </button>

          <button
            class="pill-category px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
              isCircuito && (!filters.subCategory || filters.subCategory === 'all')
                ? activePillCls
                : inactivePillCls
            }"
            data-macro="circuito"
            data-sub="all"
          >
            Placas de Circuito (${counts.circuito})
          </button>

          <button
            class="pill-category px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
              isSoquete && (!filters.subCategory || filters.subCategory === 'all')
                ? activePillCls
                : inactivePillCls
            }"
            data-macro="soquete"
            data-sub="all"
          >
            Soquetes Diversos (${counts.soquete})
          </button>

          <!-- Subcategorias Rápidas Mais Procuradas no Balcão -->
          <button
            class="pill-category px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
              filters.subCategory === 'Lanterna e Pisca' ? activePillCls : inactivePillCls
            }"
            data-macro="soquete"
            data-sub="Lanterna e Pisca"
          >
            Lanterna e Pisca (24)
          </button>

          <button
            class="pill-category px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
              filters.subCategory === 'Farol e Milha' ? activePillCls : inactivePillCls
            }"
            data-macro="soquete"
            data-sub="Farol e Milha"
          >
            Farol e Milha (9)
          </button>

          <button
            class="pill-category px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
              filters.subCategory === 'Painel e Instrumentos' ? activePillCls : inactivePillCls
            }"
            data-macro="soquete"
            data-sub="Painel e Instrumentos"
          >
            Painel e Instrumentos (17)
          </button>

          <button
            class="pill-category px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
              filters.subCategory === 'Luz de Placa' ? activePillCls : inactivePillCls
            }"
            data-macro="soquete"
            data-sub="Luz de Placa"
          >
            Luz de Placa (6)
          </button>

          <button
            class="pill-category px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
              filters.subCategory === 'Soquetes Universais e Diversos' ? activePillCls : inactivePillCls
            }"
            data-macro="soquete"
            data-sub="Soquetes Universais e Diversos"
          >
            Soquetes Universais (57)
          </button>

          <!-- Separador Vertical -->
          <span class="text-slate-300 dark:text-slate-700 font-light mx-1 hidden sm:inline">|</span>

          <!-- Dropdown de Montadora -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">
              MONTADORA:
            </span>
            <select
              id="select-filter-make"
              class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-semibold rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer transition-colors"
            >
              <option value="all" ${filters.make === 'all' || !filters.make ? 'selected' : ''}>Todas as Montadoras</option>
              <option value="VW" ${filters.make === 'VW' ? 'selected' : ''}>VW (81)</option>
              <option value="Fiat" ${filters.make === 'Fiat' ? 'selected' : ''}>Fiat (22)</option>
              <option value="GM" ${filters.make === 'GM' ? 'selected' : ''}>GM (18)</option>
              <option value="Ford" ${filters.make === 'Ford' ? 'selected' : ''}>Ford (4)</option>
              <option value="Honda" ${filters.make === 'Honda' ? 'selected' : ''}>Honda (2)</option>
              <option value="Toyota" ${filters.make === 'Toyota' ? 'selected' : ''}>Toyota (1)</option>
              <option value="Universal" ${filters.make === 'Universal' ? 'selected' : ''}>Universal (23)</option>
            </select>
          </div>

          <!-- Dropdown de Especificações Técnicas -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">
              ESPECIFICAÇÕES:
            </span>
            <select
              id="select-filter-spec"
              class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-semibold rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer transition-colors"
            >
              <option value="all" ${currentSpecVal === 'all' ? 'selected' : ''}>Todas as Especificações</option>
              <optgroup label="Placas de Circuito de Lanterna">
                <option value="side:LD" ${currentSpecVal === 'side:LD' ? 'selected' : ''}>LD (Lado Direito / Passageiro)</option>
                <option value="side:LE" ${currentSpecVal === 'side:LE' ? 'selected' : ''}>LE (Lado Esquerdo / Motorista)</option>
                <option value="side:LD/LE (Ambos)" ${currentSpecVal === 'side:LD/LE (Ambos)' ? 'selected' : ''}>Par / Ambos (LD/LE)</option>
                <option value="sys:Arteb" ${currentSpecVal === 'sys:Arteb' ? 'selected' : ''}>Sistema Lanterna Arteb</option>
                <option value="sys:Cibié" ${currentSpecVal === 'sys:Cibié' ? 'selected' : ''}>Sistema Lanterna Cibié</option>
              </optgroup>
              <optgroup label="Soquetes Automotivos">
                <option value="poles:1" ${currentSpecVal === 'poles:1' ? 'selected' : ''}>1 Polo (BA15s / 1141)</option>
                <option value="poles:2" ${currentSpecVal === 'poles:2' ? 'selected' : ''}>2 Polos (BAY15d / 1034)</option>
                <option value="lamp:H7" ${currentSpecVal === 'lamp:H7' ? 'selected' : ''}>Lâmpada H7</option>
                <option value="lamp:H4" ${currentSpecVal === 'lamp:H4' ? 'selected' : ''}>Lâmpada H4</option>
                <option value="lamp:T10" ${currentSpecVal === 'lamp:T10' ? 'selected' : ''}>Pingo T10 (Esmagadinha)</option>
                <option value="lamp:T5" ${currentSpecVal === 'lamp:T5' ? 'selected' : ''}>Painel T5 (Pinguinho)</option>
                <option value="lamp:Porcelana" ${currentSpecVal === 'lamp:Porcelana' ? 'selected' : ''}>Base Porcelana Cerâmica</option>
                <option value="lamp:Pino Desencontrado" ${currentSpecVal === 'lamp:Pino Desencontrado' ? 'selected' : ''}>Pino Desencontrado (150° / Doido)</option>
              </optgroup>
            </select>
          </div>

          <!-- Botão Limpar Filtros Ativos -->
          ${
            hasActiveFilters
              ? `<button
                  id="btn-reset-filters"
                  class="px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900 rounded-full flex items-center gap-1 transition-all shadow-sm shrink-0"
                  title="Limpar todos os filtros rápidos"
                >
                  ${icons.x("w-3.5 h-3.5")}
                  <span>Limpar Filtros</span>
                </button>`
              : ''
          }

        </div>

      </div>
    </div>
  `;

  // Listener para botões de categoria e subcategoria
  container.querySelectorAll('.pill-category').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLElement;
      const macro = el.dataset.macro as 'all' | MacroCategory;
      const sub = el.dataset.sub || 'all';
      callbacks.onCategoryPillClick(macro, sub);
    });
  });

  // Listener para o select de Montadora
  const selectMake = container.querySelector('#select-filter-make') as HTMLSelectElement | null;
  selectMake?.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    callbacks.onMakeChange(val);
  });

  // Listener para o select de Especificações
  const selectSpec = container.querySelector('#select-filter-spec') as HTMLSelectElement | null;
  selectSpec?.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    callbacks.onSpecChange(val);
  });

  // Listener para o botão de reset
  container.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
    callbacks.onResetFilters();
  });
}
