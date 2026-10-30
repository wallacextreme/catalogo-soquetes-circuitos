// Header do Catálogo de Balcão com Omnibox Sub-50ms e Controles
// Preservação Estrita de Foco (Zero perda de foco ao digitar), Botão Limpar e Privacidade

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
    const btnPricesMob = container.querySelector('#btn-prices-mobile') as HTMLElement | null;
    if (btnPrices) {
      if (filters.hidePrices) {
        btnPrices.className = "px-3 py-1.5 rounded-xl border border-red-400 dark:border-red-700 bg-red-600 text-white hover:bg-red-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm";
        btnPrices.innerHTML = `${icons.eyeOff("w-4 h-4 text-white")}<span>Preços Ocultos</span>`;
        btnPrices.title = "Preços Ocultos na Tela (Modo Privacidade Ativo). Clique para exibir.";
      } else {
        btnPrices.className = "px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm";
        btnPrices.innerHTML = `${icons.eye("w-4 h-4 text-emerald-600 dark:text-emerald-400")}<span>Preços Visíveis</span>`;
        btnPrices.title = "Preços Visíveis na Tela. Clique para ocultar (Privacidade de Balcão).";
      }
    }
    if (btnPricesMob) {
      btnPricesMob.innerHTML = filters.hidePrices
        ? icons.eyeOff("w-5 h-5 text-red-500")
        : icons.eye("w-5 h-5 text-emerald-500");
    }

    // Botão Tema Claro / Escuro
    const btnTheme = container.querySelector('#btn-toggle-theme') as HTMLElement | null;
    const btnThemeMob = container.querySelector('#btn-theme-mobile') as HTMLElement | null;
    const themeIcon = isDark ? icons.sun("w-5 h-5 text-amber-400") : icons.moon("w-5 h-5");
    if (btnTheme) btnTheme.innerHTML = themeIcon;
    if (btnThemeMob) btnThemeMob.innerHTML = themeIcon;

    return;
  }

  // ------------------------------------------------------------------------
  // CRIAÇÃO INICIAL DO DOM DO HEADER (EXECUTADO UMA ÚNICA VEZ)
  // ------------------------------------------------------------------------
  container.innerHTML = `
    <header class="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          <!-- Logo e Identificação do Balcão -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                ${icons.circuit("w-6 h-6")}
              </div>
              <div>
                <h1 class="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  CATÁLOGO DE BALCÃO
                </h1>
                <p class="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Placas de Circuito & Soquetes Automotivos
                </p>
              </div>
            </div>

            <!-- Controles Rápidos Mobile -->
            <div class="flex items-center gap-1 lg:hidden">
              <button id="btn-theme-mobile" class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" title="Alternar Modo Claro/Escuro">
                ${isDark ? icons.sun("w-5 h-5 text-amber-400") : icons.moon("w-5 h-5")}
              </button>
              <button id="btn-prices-mobile" class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" title="Privacidade Balcão">
                ${filters.hidePrices ? icons.eyeOff("w-5 h-5 text-red-500") : icons.eye("w-5 h-5 text-emerald-500")}
              </button>
            </div>
          </div>

          <!-- Omnibox de Busca Instantânea (< 50ms) -->
          <div class="flex-1 max-w-2xl mx-auto w-full">
            <div class="relative flex items-center">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                ${icons.search("w-5 h-5")}
              </div>
              <input
                type="text"
                id="omnibox-input"
                class="block w-full pl-11 pr-24 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all shadow-inner"
                placeholder="Buscar por Caixa (ex: 05, cx 12), Código (ETE-7490, DP-3015) ou Carro..."
                value="${filters.searchQuery}"
                autocomplete="off"
                spellcheck="false"
              />
              <div class="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                <!-- Botão Limpar Texto (Visível quando há texto) -->
                <button
                  type="button"
                  id="btn-clear-search"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${filters.searchQuery ? '' : 'hidden'}"
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
            <!-- Status de Busca e Latência -->
            <div class="flex items-center justify-between px-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                <strong id="header-results-count" class="font-bold text-slate-900 dark:text-slate-100">${totalResults}</strong> peças localizadas
              </span>
              <span id="header-latency-ms" class="font-mono text-emerald-600 dark:text-emerald-400">
                latência: ${latencyMs}ms
              </span>
            </div>
          </div>

          <!-- Ações e Modos de Visualização Desktop -->
          <div class="hidden lg:flex items-center gap-2">
            
            <!-- Alternador de Modos de Visão -->
            <div class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                id="btn-view-grid"
                class="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
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
                class="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
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
                class="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
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

            <!-- Ocultar Preços de Balcão (Privacidade) -->
            <button
              id="btn-toggle-prices"
              class="px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                filters.hidePrices
                  ? 'border-red-400 dark:border-red-700 bg-red-600 text-white hover:bg-red-700'
                  : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              }"
              title="${filters.hidePrices ? 'Preços Ocultos na Tela (Privacidade Ativa). Clique para exibir.' : 'Preços Visíveis. Clique para ocultar (Privacidade).'}"
            >
              ${
                filters.hidePrices
                  ? `${icons.eyeOff("w-4 h-4 text-white")}<span>Preços Ocultos</span>`
                  : `${icons.eye("w-4 h-4 text-emerald-600 dark:text-emerald-400")}<span>Preços Visíveis</span>`
              }
            </button>

            <!-- Daylight Counter Mode vs Dark Mode -->
            <button
              id="btn-toggle-theme"
              class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="${isDark ? 'Ativar Daylight Counter Mode (Alto Contraste)' : 'Ativar Dark Mode'}"
            >
              ${isDark ? icons.sun("w-5 h-5 text-amber-400") : icons.moon("w-5 h-5")}
            </button>

            <!-- Backup & Restore -->
            <button
              id="btn-backup"
              class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Backup & Sincronização SHA-256"
            >
              ${icons.download("w-5 h-5")}
            </button>

            <!-- Cadastrar Novo Produto -->
            <button
              id="btn-new-product"
              class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all active:scale-95"
              title="Cadastrar Nova Peça no Balcão"
            >
              ${icons.plus("w-4 h-4")}
              <span>Nova Peça</span>
            </button>

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

  container.querySelector('#btn-view-grid')?.addEventListener('click', () => callbacks.onViewModeChange('grid'));
  container.querySelector('#btn-view-mural')?.addEventListener('click', () => callbacks.onViewModeChange('mural'));
  container.querySelector('#btn-view-boxmap')?.addEventListener('click', () => callbacks.onOpenBoxMap());

  container.querySelector('#btn-toggle-theme')?.addEventListener('click', () => callbacks.onThemeToggle());
  container.querySelector('#btn-theme-mobile')?.addEventListener('click', () => callbacks.onThemeToggle());

  container.querySelector('#btn-toggle-prices')?.addEventListener('click', () => callbacks.onHidePricesToggle());
  container.querySelector('#btn-prices-mobile')?.addEventListener('click', () => callbacks.onHidePricesToggle());

  container.querySelector('#btn-new-product')?.addEventListener('click', () => callbacks.onNewProduct());
  container.querySelector('#btn-backup')?.addEventListener('click', () => callbacks.onOpenBackup());
}
