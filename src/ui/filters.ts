// Barra de Filtros Rápidos Organizada e Sem Barra de Rolagem (flex-wrap responsivo)
import { FilterState, MacroCategory } from '../types/catalog';
import { icons } from './icons';

export interface FilterCallbacks {
  onMacroChange: (macro: 'all' | MacroCategory) => void;
  onCircuitSideChange: (side: 'all' | 'LD' | 'LE' | 'LD/LE (Ambos)') => void;
  onCircuitSystemChange: (system: 'all' | 'Arteb' | 'Cibié') => void;
  onSocketPolesChange: (poles: 'all' | 1 | 2) => void;
  onSocketLampChange: (lamp: 'all' | 'H7' | 'H4' | 'T10' | 'T5' | 'Porcelana' | 'Pino Desencontrado') => void;
  onMakeChange: (make: string) => void;
  onHasPhotoChange?: (status: 'all' | 'withPhoto' | 'multiPhoto') => void;
  onResetFilters: () => void;
}

export function renderFilters(
  container: HTMLElement,
  filters: FilterState,
  counts: { total: number; circuito: number; soquete: number },
  callbacks: FilterCallbacks
): void {
  const isCircuito = filters.macroCategory === 'circuito';
  const isSoquete = filters.macroCategory === 'soquete';
  const isAll = filters.macroCategory === 'all';

  const hasActiveFilters =
    filters.circuitSide !== 'all' ||
    filters.circuitSystem !== 'all' ||
    filters.socketPoles !== 'all' ||
    filters.socketLamp !== 'all' ||
    (filters.make && filters.make !== 'all');

  container.innerHTML = `
    <div class="bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 py-3 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        
        <!-- 1. Linha Superior: Macro-Abas Principais + Botão Limpar Filtros -->
        <div class="flex items-center justify-between flex-wrap gap-2.5">
          <div class="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl shadow-inner">
            <button
              id="tab-macro-all"
              class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isAll
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }"
            >
              <span>Todos os Itens</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 font-black">${counts.total}</span>
            </button>

            <button
              id="tab-macro-circuito"
              class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isCircuito
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
              }"
            >
              ${icons.circuit("w-4 h-4")}
              <span>Placas de Circuito</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${isCircuito ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800'} font-black">${counts.circuito}</span>
            </button>

            <button
              id="tab-macro-soquete"
              class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isSoquete
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
              }"
            >
              ${icons.socket("w-4 h-4")}
              <span>Soquetes Diversos</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${isSoquete ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800'} font-black">${counts.soquete}</span>
            </button>
          </div>

          <!-- Botão Limpar Filtros Ativos -->
          ${
            hasActiveFilters
              ? `<button id="btn-reset-filters" class="px-3 py-1.5 text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-1.5 transition-all shadow-sm">
                  ${icons.x("w-3.5 h-3.5")}
                  <span>Limpar Filtros</span>
                </button>`
              : ''
          }
        </div>

        <!-- 2. Linha Inferior: Filtros Técnicos Estruturados SEM Barra de Rolagem (Wrap Natural) -->
        <div class="flex flex-wrap items-center gap-3 pt-0.5">
          
          <!-- SEÇÃO A: FILTROS DE PLACAS DE CIRCUITO (Lado & Sistema) -->
          ${
            isCircuito || isAll
              ? `
              <!-- Grupo Lado LD / LE -->
              <div class="flex items-center gap-1 bg-white dark:bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <span class="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 pr-1">Lado:</span>
                <button
                  class="pill-side px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filters.circuitSide === 'LD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-side="LD"
                >LD (Direito)</button>
                <button
                  class="pill-side px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filters.circuitSide === 'LE' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-side="LE"
                >LE (Esquerdo)</button>
                <button
                  class="pill-side px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filters.circuitSide === 'LD/LE (Ambos)' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-side="LD/LE (Ambos)"
                >Par/Ambos</button>
              </div>

              <!-- Grupo Sistema da Lanterna -->
              <div class="flex items-center gap-1 bg-white dark:bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <span class="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 pr-1">Lanterna:</span>
                <button
                  class="pill-system px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filters.circuitSystem === 'Arteb' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-system="Arteb"
                >Arteb</button>
                <button
                  class="pill-system px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filters.circuitSystem === 'Cibié' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-system="Cibié"
                >Cibié</button>
              </div>
              `
              : ''
          }

          <!-- SEÇÃO B: FILTROS DE SOQUETES (Polos & Lâmpadas) -->
          ${
            isSoquete || isAll
              ? `
              <!-- Grupo Polos -->
              <div class="flex items-center gap-1 bg-white dark:bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <span class="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 pr-1">Polos:</span>
                <button
                  class="pill-poles px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filters.socketPoles === 1 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-poles="1"
                >1 Polo</button>
                <button
                  class="pill-poles px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filters.socketPoles === 2 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-poles="2"
                >2 Polos</button>
              </div>

              <!-- Grupo Lâmpada / Base -->
              <div class="flex items-center gap-1 bg-white dark:bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-wrap">
                <span class="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 pr-1">Lâmpada:</span>
                <button
                  class="pill-lamp px-2 py-1 rounded-lg text-xs font-bold transition-all ${filters.socketLamp === 'H7' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="H7"
                >H7</button>
                <button
                  class="pill-lamp px-2 py-1 rounded-lg text-xs font-bold transition-all ${filters.socketLamp === 'H4' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="H4"
                >H4</button>
                <button
                  class="pill-lamp px-2 py-1 rounded-lg text-xs font-bold transition-all ${filters.socketLamp === 'T10' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="T10"
                >Pingo T10</button>
                <button
                  class="pill-lamp px-2 py-1 rounded-lg text-xs font-bold transition-all ${filters.socketLamp === 'T5' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="T5"
                >Painel T5</button>
                <button
                  class="pill-lamp px-2 py-1 rounded-lg text-xs font-bold transition-all ${filters.socketLamp === 'Porcelana' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="Porcelana"
                >Porcelana</button>
                <button
                  class="pill-lamp px-2 py-1 rounded-lg text-xs font-bold transition-all ${filters.socketLamp === 'Pino Desencontrado' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="Pino Desencontrado"
                >Pino Desencontrado</button>
              </div>
              `
              : ''
          }

          <!-- SEÇÃO C: FILTRO DE MONTADORA -->
          <div class="flex items-center gap-1 bg-white dark:bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-wrap">
            <span class="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 pr-1">Montadora:</span>
            ${['VW', 'Fiat', 'GM', 'Ford', 'Honda', 'Universal'].map(make => `
              <button
                class="pill-make px-2 py-1 rounded-lg text-xs font-bold transition-all ${filters.make === make ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                data-make="${make}"
              >${make}</button>
            `).join('')}
          </div>

        </div>

      </div>
    </div>
  `;

  // Listeners das Abas Principais
  container.querySelector('#tab-macro-all')?.addEventListener('click', () => callbacks.onMacroChange('all'));
  container.querySelector('#tab-macro-circuito')?.addEventListener('click', () => callbacks.onMacroChange('circuito'));
  container.querySelector('#tab-macro-soquete')?.addEventListener('click', () => callbacks.onMacroChange('soquete'));

  container.querySelector('#btn-reset-filters')?.addEventListener('click', () => callbacks.onResetFilters());

  // Listeners dos pills de Lado
  container.querySelectorAll('.pill-side').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const side = (e.currentTarget as HTMLElement).dataset.side as any;
      callbacks.onCircuitSideChange(filters.circuitSide === side ? 'all' : side);
    });
  });

  // Listeners dos pills de Sistema Lanterna
  container.querySelectorAll('.pill-system').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const system = (e.currentTarget as HTMLElement).dataset.system as any;
      callbacks.onCircuitSystemChange(filters.circuitSystem === system ? 'all' : system);
    });
  });

  // Listeners dos pills de Polos
  container.querySelectorAll('.pill-poles').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const poles = parseInt((e.currentTarget as HTMLElement).dataset.poles || '0', 10) as 1 | 2;
      callbacks.onSocketPolesChange(filters.socketPoles === poles ? 'all' : poles);
    });
  });

  // Listeners dos pills de Lâmpada
  container.querySelectorAll('.pill-lamp').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lamp = (e.currentTarget as HTMLElement).dataset.lamp as any;
      callbacks.onSocketLampChange(filters.socketLamp === lamp ? 'all' : lamp);
    });
  });

  // Listeners dos pills de Montadora
  container.querySelectorAll('.pill-make').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const make = (e.currentTarget as HTMLElement).dataset.make || '';
      callbacks.onMakeChange(filters.make === make ? 'all' : make);
    });
  });
}
