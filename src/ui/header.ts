// Header do Catálogo de Balcão - Layout Profissional Padrão Ouro
// Linha 1: Branding + Controles (Grade/Mural/Caixas, Privacidade, Tema, Backup, + Cadastrar)
// Linha 2: Barra de Busca Full-Width com borda azul e placeholder completo
// Linha 3: EXEMPLOS RÁPIDOS com pills clicáveis e status de busca

import { FilterState, ViewMode } from '../types/catalog';
import { icons } from './icons';

export interface HeaderCallbacks {
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onThemeToggle: () => void;
  onHidePricesToggle: () => void;
  onNewProduct: () => void;
  onOpenBoxMap: () => void;
  onOpenBackup: () => void;
  onExampleClick?: (query: string) => void;
}

export function renderHeader(
  container: HTMLElement,
  filters: FilterState,
  totalResults: number,
  latencyMs: number,
  isDark: boolean,
  callbacks: HeaderCallbacks
): void {
  const existingHeader = container.querySelector('header');

  if (existingHeader) {
    // ------------------------------------------------------------------------
    // ATUALIZAÇÃO REATIVA SEM RECONSTRUIR O DOM (PRESERVA FOCO E CURSOR)
    // ------------------------------------------------------------------------
    const resultsCountEl = container.querySelector('#header-results-count');
    if (resultsCountEl) resultsCountEl.textContent = String(totalResults);

    const latencyEl = container.querySelector('#header-latency-ms');
    if (latencyEl) latencyEl.textContent = `latência: ${latencyMs}ms`;

    const omnibox = container.querySelector('#omnibox-input') as HTMLInputElement | null;
    if (omnibox && document.activeElement !== omnibox && omnibox.value !== filters.searchQuery) {
      omnibox.value = filters.searchQuery;
    }

    // Botão Limpar e Atalho '/'
    const btnClear = container.querySelector('#btn-clear-search') as HTMLElement | null;
    const slashBadge = container.querySelector('#slash-badge') as HTMLElement | null;
    if (btnClear && slashBadge) {
      if (filters.searchQuery) {
        btnClear.classList.remove('hidden');
        slashBadge.classList.add('hidden');
      } else {
        btnClear.classList.add('hidden');
        slashBadge.classList.remove('hidden');
      }
    }

    // Botões de Modo de Visão (Grade / Mural / Caixas)
    const activeViewCls = ['bg-white', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm'];
    const inactiveViewCls = ['text-slate-600', 'dark:text-slate-400'];

    const btnGrid = container.querySelector('#btn-view-grid');
    const btnMural = container.querySelector('#btn-view-mural');
    const btnBoxmap = container.querySelector('#btn-view-boxmap');

    [btnGrid, btnMural, btnBoxmap].forEach(btn => {
      btn?.classList.remove(...activeViewCls);
      btn?.classList.add(...inactiveViewCls);
    });

    if (filters.viewMode === 'grid') {
      btnGrid?.classList.remove(...inactiveViewCls);
      btnGrid?.classList.add(...activeViewCls);
    } else if (filters.viewMode === 'mural') {
      btnMural?.classList.remove(...inactiveViewCls);
      btnMural?.classList.add(...activeViewCls);
    } else if (filters.viewMode === 'boxmap') {
      btnBoxmap?.classList.remove(...inactiveViewCls);
      btnBoxmap?.classList.add(...activeViewCls);
    }

    // Botão Ocultar / Mostrar Preços
    const btnPrices = container.querySelector('#btn-toggle-prices') as HTMLElement | null;
    if (btnPrices) {
      if (filters.hidePrices) {
        btnPrices.className = "p-2 rounded-xl border border-red-300 dark:border-red-800 bg-red-600 text-white hover:bg-red-700 transition-all shadow-sm";
        btnPrices.innerHTML = icons.eyeOff("w-5 h-5 text-white");
        btnPrices.title = "Preços Ocultos na Tela (Modo Privacidade Ativo). Clique para exibir.";
      } else {
        btnPrices.className = "p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm";
        btnPrices.innerHTML = icons.eye("w-5 h-5 text-emerald-600 dark:text-emerald-400");
        btnPrices.title = "Preços Visíveis na Tela. Clique para ocultar (Privacidade de Balcão).";
      }
    }

    // Botão Tema Claro / Escuro
    const btnTheme = container.querySelector('#btn-toggle-theme') as HTMLElement | null;
    const themeIcon = isDark ? icons.sun("w-5 h-5 text-amber-400") : icons.moon("w-5 h-5");
    if (btnTheme) btnTheme.innerHTML = themeIcon;

    return;
  }

  // ------------------------------------------------------------------------
  // CRIAÇÃO INICIAL DO DOM DO HEADER (EXECUTADO UMA ÚNICA VEZ)
  // ------------------------------------------------------------------------
  container.innerHTML = `
    <header class="w-full">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2 space-y-2.5">
        
        <!-- LINHA 1: BRANDING (ESQUERDA) + CONTROLES DE BALCÃO (DIREITA) -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          <!-- Identificação Oficial do Balcão -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              ${icons.circuit("w-6 h-6")}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  CATÁLOGO DE BALCÃO
                </h1>
                <span class="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  PLACAS DE CIRCUITO & SOQUETES
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Localizador Visual de Caixas Físicas • Busca Instantânea Sub-50ms • Multi-Ângulos WebP
              </p>
            </div>
          </div>

          <!-- Controles de Visualização, Privacidade, Tema e Cadastro -->
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
            
            <!-- Grupo Alternador de Modos (Grade | Mural | Caixas) -->
            <div class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <button
                id="btn-view-grid"
                class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  filters.viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }"
                title="Grade Detalhada de Balcão"
              >
                ${icons.grid("w-4 h-4")}
                <span>Grade</span>
              </button>
              
              <button
                id="btn-view-mural"
                class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  filters.viewMode === 'mural'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }"
                title="Mural Visual Comparador de Amostras (Fotos Grandes)"
              >
                ${icons.mural("w-4 h-4")}
                <span>Mural</span>
              </button>

              <button
                id="btn-view-boxmap"
                class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  filters.viewMode === 'boxmap'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }"
                title="Mapa Geral de Caixas e Estoque Físico"
              >
                ${icons.map("w-4 h-4")}
                <span>Caixas</span>
              </button>
            </div>

            <!-- Botão Ocultar / Mostrar Preços (Privacidade) -->
            <button
              id="btn-toggle-prices"
              class="p-2 rounded-xl border transition-all shadow-sm ${
                filters.hidePrices
                  ? 'border-red-400 dark:border-red-700 bg-red-600 text-white hover:bg-red-700'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }"
              title="${filters.hidePrices ? 'Preços Ocultos na Tela (Privacidade Ativa). Clique para exibir.' : 'Preços Visíveis. Clique para ocultar (Privacidade).'}"
            >
              ${
                filters.hidePrices
                  ? icons.eyeOff("w-5 h-5 text-white")
                  : icons.eye("w-5 h-5 text-emerald-600 dark:text-emerald-400")
              }
            </button>

            <!-- Botão Tema Claro / Escuro -->
            <button
              id="btn-toggle-theme"
              class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="${isDark ? 'Ativar Daylight Counter Mode (Alto Contraste)' : 'Ativar Dark Mode'}"
            >
              ${isDark ? icons.sun("w-5 h-5 text-amber-400") : icons.moon("w-5 h-5")}
            </button>

            <!-- Botão Backup / Sincronização SHA-256 -->
            <button
              id="btn-backup"
              class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Backup, Restauração e Auditoria SHA-256"
            >
              ${icons.shield("w-5 h-5")}
            </button>

            <!-- Botão Cadastrar Peça -->
            <button
              id="btn-new-product"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/25 active:scale-95 transition-all shrink-0"
              title="Cadastrar Nova Peça no Balcão"
            >
              ${icons.plus("w-4 h-4")}
              <span>+ Cadastrar Peça</span>
            </button>

          </div>

        </div>

        <!-- LINHA 2: BARRA DE BUSCA OMNIBOX FULL-WIDTH COM BORDA AZUL -->
        <div class="relative w-full">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            ${icons.search("w-5 h-5")}
          </div>
          <input
            type="text"
            id="omnibox-input"
            class="block w-full pl-12 pr-12 py-3 bg-white dark:bg-slate-800/90 border-2 border-blue-500 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-sm transition-all"
            placeholder="Digite o Nº da Caixa (ex: 01, 73, 26), Código (ETE-7491, DP-3111, DP-2001, DEP2272) ou Aplicação/Veículo (ex: gol bola ld, palio le, h7 porcelana, uno cibie)..."
            title="Digite o Nº da Caixa (ex: 01, 73, 26), Código (ETE-7491, DP-3111, DP-2001, DEP2272) ou Aplicação/Veículo (ex: gol bola ld, palio le, h7 porcelana, uno cibie)..."
            value="${filters.searchQuery}"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
            <!-- Botão Limpar Texto (Visível quando há texto) -->
            <button
              type="button"
              id="btn-clear-search"
              class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${filters.searchQuery ? '' : 'hidden'}"
              title="Limpar busca (Esc)"
            >
              ${icons.x("w-4 h-4")}
            </button>
            <!-- Dica Tecla '/' -->
            <span
              id="slash-badge"
              class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded ${filters.searchQuery ? 'hidden' : ''}"
            >/</span>
          </div>
        </div>

        <!-- LINHA 3: EXEMPLOS RÁPIDOS CLICÁVEIS + STATUS E LATÊNCIA -->
        <div class="flex items-center justify-between gap-3 text-xs flex-wrap">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
              EXEMPLOS RÁPIDOS:
            </span>
            <div class="flex items-center gap-1 flex-wrap">
              <button class="btn-quick-example px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors" data-query="01">CX 01</button>
              <button class="btn-quick-example px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors" data-query="73">CX 73</button>
              <button class="btn-quick-example px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors" data-query="ETE-7491">ETE-7491</button>
              <button class="btn-quick-example px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors" data-query="DP-3111">DP-3111</button>
              <button class="btn-quick-example px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors" data-query="DP2001">DP2001</button>
              <button class="btn-quick-example px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors" data-query="DEP2272">DEP2272</button>
              <button class="btn-quick-example px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors" data-query="gol bola ld">Gol Bola LD</button>
              <button class="btn-quick-example px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors" data-query="celta le">Celta LE</button>
              <button class="btn-quick-example px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors" data-query="h7 porcelana">H7 Porcelana</button>
              <button class="btn-quick-example px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors" data-query="pino doido">Pino Doido</button>
            </div>
          </div>

          <!-- Total de Peças & Latência -->
          <div class="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0 ml-auto">
            <span>
              <strong id="header-results-count" class="font-bold text-slate-900 dark:text-slate-100">${totalResults}</strong> peças localizadas
            </span>
            <span>•</span>
            <span id="header-latency-ms" class="font-mono text-emerald-600 dark:text-emerald-400">
              latência: ${latencyMs}ms
            </span>
          </div>
        </div>

      </div>
    </header>
  `;

  // Attach event listeners (uma única vez!)
  const omnibox = container.querySelector('#omnibox-input') as HTMLInputElement | null;
  const btnClear = container.querySelector('#btn-clear-search') as HTMLElement | null;
  const slashBadge = container.querySelector('#slash-badge') as HTMLElement | null;

  if (omnibox) {
    omnibox.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      if (btnClear && slashBadge) {
        if (val) {
          btnClear.classList.remove('hidden');
          slashBadge.classList.add('hidden');
        } else {
          btnClear.classList.add('hidden');
          slashBadge.classList.remove('hidden');
        }
      }
      callbacks.onSearchChange(val);
    });

    omnibox.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        omnibox.value = '';
        if (btnClear && slashBadge) {
          btnClear.classList.add('hidden');
          slashBadge.classList.remove('hidden');
        }
        callbacks.onSearchChange('');
        omnibox.focus();
      }
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (omnibox) {
        omnibox.value = '';
        omnibox.focus();
      }
      btnClear.classList.add('hidden');
      slashBadge?.classList.remove('hidden');
      callbacks.onSearchChange('');
    });
  }

  // Exemplos rápidos clicáveis
  container.querySelectorAll('.btn-quick-example').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = (btn as HTMLElement).dataset.query || '';
      if (omnibox) {
        omnibox.value = q;
        omnibox.focus();
      }
      if (btnClear && slashBadge) {
        btnClear.classList.remove('hidden');
        slashBadge.classList.add('hidden');
      }
      callbacks.onSearchChange(q);
    });
  });

  container.querySelector('#btn-view-grid')?.addEventListener('click', () => callbacks.onViewModeChange('grid'));
  container.querySelector('#btn-view-mural')?.addEventListener('click', () => callbacks.onViewModeChange('mural'));
  container.querySelector('#btn-view-boxmap')?.addEventListener('click', () => callbacks.onOpenBoxMap());

  container.querySelector('#btn-toggle-theme')?.addEventListener('click', () => callbacks.onThemeToggle());
  container.querySelector('#btn-toggle-prices')?.addEventListener('click', () => callbacks.onHidePricesToggle());

  container.querySelector('#btn-new-product')?.addEventListener('click', () => callbacks.onNewProduct());
  container.querySelector('#btn-backup')?.addEventListener('click', () => callbacks.onOpenBackup());
}
