// Barra de Filtros Rápidos de 1 Clique (Macro-Categorias, LD/LE, Polos, Farol, Montadora)
import { FilterState, MacroCategory } from '../types/catalog';
import { icons } from './icons';

export interface FilterCallbacks {
  onMacroChange: (macro: 'all' | MacroCategory) => void;
  onCircuitSideChange: (side: 'all' | 'LD' | 'LE' | 'LD/LE (Ambos)') => void;
  onCircuitSystemChange: (system: 'all' | 'Arteb' | 'Cibié') => void;
  onSocketPolesChange: (poles: 'all' | 1 | 2) => void;
  onSocketLampChange: (lamp: 'all' | 'H1' | 'H4' | 'H7' | 'T10' | 'T5' | '69' | '75' | 'Porcelana' | 'Pino Desencontrado') => void;
  onMakeChange: (make: string) => void;
  onHasPhotoChange: (status: 'all' | 'withPhoto' | 'multiPhoto') => void;
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

  container.innerHTML = `
    <div class="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 py-3 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2.5">
        
        <!-- 1. Macro-Abas Principais (Todos, Circuitos, Soquetes) -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl">
            <button
              id="tab-macro-all"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filters.macroCategory === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }"
            >
              <span>Todos os Itens</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 font-bold">${counts.total}</span>
            </button>

            <button
              id="tab-macro-circuito"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filters.macroCategory === 'circuito'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
              }"
            >
              ${icons.circuit("w-3.5 h-3.5")}
              <span>Placas de Circuito</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono ${filters.macroCategory === 'circuito' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800'} font-bold">${counts.circuito}</span>
            </button>

            <button
              id="tab-macro-soquete"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filters.macroCategory === 'soquete'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
              }"
            >
              ${icons.socket("w-3.5 h-3.5")}
              <span>Soquetes Diversos</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono ${filters.macroCategory === 'soquete' ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800'} font-bold">${counts.soquete}</span>
            </button>
          </div>

          <!-- Limpar Filtros -->
          ${
            filters.circuitSide !== 'all' || filters.circuitSystem !== 'all' || filters.socketPoles !== 'all' || filters.socketLamp !== 'all' || (filters.make && filters.make !== 'all')
              ? `<button id="btn-reset-filters" class="px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg flex items-center gap-1">
                  ${icons.x("w-3.5 h-3.5")}
                  <span>Limpar Filtros</span>
                </button>`
              : ''
          }
        </div>

        <!-- 2. Filtros Rápidos Contextuais -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          
          <!-- Seção de Placas de Circuito: Filtro de Lado LD / LE -->
          ${
            isCircuito || filters.macroCategory === 'all'
              ? `
              <div class="flex items-center gap-1 bg-white dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-2">Lado:</span>
                <button
                  class="pill-side px-2 py-1 rounded text-xs font-bold transition-colors ${filters.circuitSide === 'LD' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-side="LD"
                >LD (Direito)</button>
                <button
                  class="pill-side px-2 py-1 rounded text-xs font-bold transition-colors ${filters.circuitSide === 'LE' ? 'bg-amber-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-side="LE"
                >LE (Esquerdo)</button>
                <button
                  class="pill-side px-2 py-1 rounded text-xs font-bold transition-colors ${filters.circuitSide === 'LD/LE (Ambos)' ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-side="LD/LE (Ambos)"
                >Par/Ambos</button>
              </div>

              <!-- Sistema Lanterna Arteb / Cibié -->
              <div class="flex items-center gap-1 bg-white dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-2">Lanterna:</span>
                <button
                  class="pill-system px-2 py-1 rounded text-xs font-bold transition-colors ${filters.circuitSystem === 'Arteb' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-system="Arteb"
                >Arteb</button>
                <button
                  class="pill-system px-2 py-1 rounded text-xs font-bold transition-colors ${filters.circuitSystem === 'Cibié' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-system="Cibié"
                >Cibié</button>
              </div>
              `
              : ''
          }

          <!-- Seção de Soquetes: Polos e Lâmpadas -->
          ${
            isSoquete || filters.macroCategory === 'all'
              ? `
              <div class="flex items-center gap-1 bg-white dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-2">Polos:</span>
                <button
                  class="pill-poles px-2 py-1 rounded text-xs font-bold transition-colors ${filters.socketPoles === 1 ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-poles="1"
                >1 Polo</button>
                <button
                  class="pill-poles px-2 py-1 rounded text-xs font-bold transition-colors ${filters.socketPoles === 2 ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-poles="2"
                >2 Polos</button>
              </div>

              <!-- Lâmpada / Base -->
              <div class="flex items-center gap-1 bg-white dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-2">Lâmpada:</span>
                <button
                  class="pill-lamp px-2 py-1 rounded text-xs font-bold transition-colors ${filters.socketLamp === 'H7' ? 'bg-amber-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="H7"
                >H7</button>
                <button
                  class="pill-lamp px-2 py-1 rounded text-xs font-bold transition-colors ${filters.socketLamp === 'H4' ? 'bg-amber-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="H4"
                >H4</button>
                <button
                  class="pill-lamp px-2 py-1 rounded text-xs font-bold transition-colors ${filters.socketLamp === 'T10' ? 'bg-amber-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="T10"
                >Pingo T10</button>
                <button
                  class="pill-lamp px-2 py-1 rounded text-xs font-bold transition-colors ${filters.socketLamp === 'T5' ? 'bg-amber-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="T5"
                >Painel T5</button>
                <button
                  class="pill-lamp px-2 py-1 rounded text-xs font-bold transition-colors ${filters.socketLamp === 'Porcelana' ? 'bg-amber-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="Porcelana"
                >Porcelana</button>
                <button
                  class="pill-lamp px-2 py-1 rounded text-xs font-bold transition-colors ${filters.socketLamp === 'Pino Desencontrado' ? 'bg-amber-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                  data-lamp="Pino Desencontrado"
                >Pino Desencontrado</button>
              </div>
              `
              : ''
          }

          <!-- Montadora -->
          <div class="flex items-center gap-1 bg-white dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-2">Montadora:</span>
            ${['VW', 'Fiat', 'GM', 'Ford', 'Honda', 'Universal'].map(make => `
              <button
                class="pill-make px-2 py-1 rounded text-xs font-bold transition-colors ${filters.make === make ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
                data-make="${make}"
              >${make}</button>
            `).join('')}
          </div>

        </div>

      </div>
    </div>
  `;

  // Listeners
  container.querySelector('#tab-macro-all')?.addEventListener('click', () => callbacks.onMacroChange('all'));
  container.querySelector('#tab-macro-circuito')?.addEventListener('click', () => callbacks.onMacroChange('circuito'));
  container.querySelector('#tab-macro-soquete')?.addEventListener('click', () => callbacks.onMacroChange('soquete'));

  container.querySelector('#btn-reset-filters')?.addEventListener('click', () => callbacks.onResetFilters());

  container.querySelectorAll('.pill-side').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const side = (e.currentTarget as HTMLElement).dataset.side as any;
      callbacks.onCircuitSideChange(filters.circuitSide === side ? 'all' : side);
    });
  });

  container.querySelectorAll('.pill-system').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const system = (e.currentTarget as HTMLElement).dataset.system as any;
      callbacks.onCircuitSystemChange(filters.circuitSystem === system ? 'all' : system);
    });
  });

  container.querySelectorAll('.pill-poles').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const poles = parseInt((e.currentTarget as HTMLElement).dataset.poles || '0', 10) as 1 | 2;
      callbacks.onSocketPolesChange(filters.socketPoles === poles ? 'all' : poles);
    });
  });

  container.querySelectorAll('.pill-lamp').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lamp = (e.currentTarget as HTMLElement).dataset.lamp as any;
      callbacks.onSocketLampChange(filters.socketLamp === lamp ? 'all' : lamp);
    });
  });

  container.querySelectorAll('.pill-make').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const make = (e.currentTarget as HTMLElement).dataset.make || '';
      callbacks.onMakeChange(filters.make === make ? 'all' : make);
    });
  });
}
