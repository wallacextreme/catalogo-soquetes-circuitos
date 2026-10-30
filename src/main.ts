// Main Application Entry Point — Catálogo de Balcão (Padrão Ouro 10/10)
import './style.css';
import seedData from './data/catalog-master-seed.json';
import { CatalogItem, FilterState, ViewMode, MacroCategory } from './types/catalog';
import {
  openDatabase,
  getAllItems,
  syncStaticCatalogUpdates,
  saveItem,
  updateBoxNumber,
  deleteItem,
} from './storage/indexeddb';
import { searchCatalog } from './search/omnibox-engine';
import { renderHeader } from './ui/header';
import { renderFilters } from './ui/filters';
import { renderProductCard } from './ui/product-card';
import { renderProductMural } from './ui/product-mural';
import { LightboxModal } from './ui/lightbox-modal';
import { ProductFormModal } from './ui/product-form-modal';
import { BoxMapModal } from './ui/box-map-modal';
import { BackupModal } from './ui/backup-modal';
import { extractImageFromClipboard } from './media/webp-converter';

class App {
  private allItems: CatalogItem[] = [];
  private currentResults: CatalogItem[] = [];
  private currentLatencyMs = 0;
  private isDark = false;

  private filters: FilterState = {
    searchQuery: '',
    macroCategory: 'all',
    circuitSide: 'all',
    circuitSystem: 'all',
    socketPoles: 'all',
    socketLamp: 'all',
    make: 'all',
    hasPhoto: 'all',
    viewMode: 'grid',
    hidePrices: false,
  };

  // Modais
  private lightboxModal!: LightboxModal;
  private productFormModal!: ProductFormModal;
  private boxMapModal!: BoxMapModal;
  private backupModal!: BackupModal;

  // DOM Elements
  private headerRoot = document.getElementById('header-root')!;
  private filtersRoot = document.getElementById('filters-root')!;
  private productsContainer = document.getElementById('products-container')!;
  private emptyState = document.getElementById('empty-state')!;

  public async init(): Promise<void> {
    // 1. Inicializa Modais
    this.lightboxModal = new LightboxModal();
    this.productFormModal = new ProductFormModal();
    this.boxMapModal = new BoxMapModal();
    this.backupModal = new BackupModal();

    // 2. Carrega Tema Inicial (Daylight Counter Mode por padrão)
    const savedTheme = localStorage.getItem('balcao_theme');
    this.isDark = savedTheme === 'dark';
    if (this.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Inicializa IndexedDB e Sincroniza Seed
    try {
      await openDatabase();
      const existingItems = await getAllItems();
      if (existingItems.length === 0) {
        this.allItems = await syncStaticCatalogUpdates(seedData.items as CatalogItem[]);
      } else {
        // Mescla garantindo integridade inviolável
        this.allItems = await syncStaticCatalogUpdates(seedData.items as CatalogItem[]);
      }
    } catch (err) {
      console.warn('Fallback para seed estático devido ao IndexedDB:', err);
      this.allItems = seedData.items as CatalogItem[];
    }

    // 4. Registra Service Worker (PWA Offline)
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[SW] Falha no registro:', err);
        });
      });
    }

    // 5. Setup de Atalhos de Teclado
    this.setupKeybindings();

    // 6. Listener para botão de limpar do estado vazio
    document.getElementById('btn-empty-clear')?.addEventListener('click', () => {
      this.resetAllFilters();
    });

    // 7. Render Inicial
    this.runSearchAndRender();
  }

  private setupKeybindings(): void {
    window.addEventListener('keydown', (e) => {
      // Pressionar '/' ou Ctrl+K foca a Omnibox
      if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const omnibox = document.getElementById('omnibox-input') as HTMLInputElement | null;
        omnibox?.focus();
        omnibox?.select();
      }
    });

    // Ctrl+V na tela principal abre o modal de cadastro com a foto colada
    window.addEventListener('paste', (e: ClipboardEvent) => {
      const file = extractImageFromClipboard(e);
      if (file && document.getElementById('product-form-modal-root')?.classList.contains('hidden')) {
        e.preventDefault();
        this.productFormModal.open(null, {
          onSave: async (item) => {
            await saveItem(item, true);
            this.allItems.unshift(item);
            this.runSearchAndRender();
          },
        });
      }
    });
  }

  private runSearchAndRender(): void {
    const { results, latencyMs } = searchCatalog(this.allItems, this.filters);
    this.currentResults = results;
    this.currentLatencyMs = latencyMs;

    this.renderHeaderComponent();
    this.renderFiltersComponent();
    this.renderProductsComponent();
  }

  private renderHeaderComponent(): void {
    renderHeader(
      this.headerRoot,
      this.filters,
      this.currentResults.length,
      this.currentLatencyMs,
      this.isDark,
      {
        onSearchChange: (q) => {
          this.filters.searchQuery = q;
          this.runSearchAndRender();
        },
        onViewModeChange: (mode: ViewMode) => {
          this.filters.viewMode = mode;
          this.runSearchAndRender();
        },
        onThemeToggle: () => {
          this.isDark = !this.isDark;
          localStorage.setItem('balcao_theme', this.isDark ? 'dark' : 'daylight');
          if (this.isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          this.renderHeaderComponent();
        },
        onHidePricesToggle: () => {
          this.filters.hidePrices = !this.filters.hidePrices;
          this.runSearchAndRender();
        },
        onNewProduct: () => {
          this.productFormModal.open(null, {
            onSave: async (item) => {
              await saveItem(item, true);
              this.allItems.unshift(item);
              this.runSearchAndRender();
            },
          });
        },
        onOpenBoxMap: () => {
          this.boxMapModal.open(this.allItems, (boxNumber) => {
            this.filters.searchQuery = boxNumber;
            this.runSearchAndRender();
          });
        },
        onOpenBackup: () => {
          this.backupModal.open({
            onDataRestored: async () => {
              this.allItems = await getAllItems();
              this.runSearchAndRender();
            },
            onResetToFactorySeed: async () => {
              this.allItems = await syncStaticCatalogUpdates(seedData.items as CatalogItem[]);
              this.runSearchAndRender();
            },
          });
        },
      }
    );
  }

  private renderFiltersComponent(): void {
    const totalCount = this.allItems.length;
    const circuitoCount = this.allItems.filter(it => it.macroCategory === 'circuito').length;
    const soqueteCount = this.allItems.filter(it => it.macroCategory === 'soquete').length;

    renderFilters(
      this.filtersRoot,
      this.filters,
      { total: totalCount, circuito: circuitoCount, soquete: soqueteCount },
      {
        onMacroChange: (macro: 'all' | MacroCategory) => {
          this.filters.macroCategory = macro;
          this.runSearchAndRender();
        },
        onCircuitSideChange: (side) => {
          this.filters.circuitSide = side;
          this.runSearchAndRender();
        },
        onCircuitSystemChange: (sys) => {
          this.filters.circuitSystem = sys;
          this.runSearchAndRender();
        },
        onSocketPolesChange: (poles) => {
          this.filters.socketPoles = poles;
          this.runSearchAndRender();
        },
        onSocketLampChange: (lamp) => {
          this.filters.socketLamp = lamp;
          this.runSearchAndRender();
        },
        onMakeChange: (make) => {
          this.filters.make = make === this.filters.make ? 'all' : make;
          this.runSearchAndRender();
        },
        onHasPhotoChange: (status) => {
          this.filters.hasPhoto = status;
          this.runSearchAndRender();
        },
        onResetFilters: () => {
          this.resetAllFilters();
        },
      }
    );
  }

  private resetAllFilters(): void {
    this.filters.searchQuery = '';
    this.filters.circuitSide = 'all';
    this.filters.circuitSystem = 'all';
    this.filters.socketPoles = 'all';
    this.filters.socketLamp = 'all';
    this.filters.make = 'all';
    this.filters.hasPhoto = 'all';
    this.runSearchAndRender();
  }

  private renderProductsComponent(): void {
    this.productsContainer.innerHTML = '';

    if (this.currentResults.length === 0) {
      this.productsContainer.classList.add('hidden');
      this.emptyState.classList.remove('hidden');
      return;
    }

    this.emptyState.classList.add('hidden');
    this.productsContainer.classList.remove('hidden');

    const cardCallbacks = {
      onOpenLightbox: (item: CatalogItem, initialIdx?: number) => {
        this.lightboxModal.open(item, initialIdx || 0);
      },
      onEditProduct: (item: CatalogItem) => {
        this.productFormModal.open(item, {
          onSave: async (updated) => {
            await saveItem(updated, true);
            const idx = this.allItems.findIndex(it => it.id === updated.id);
            if (idx >= 0) this.allItems[idx] = updated;
            this.runSearchAndRender();
          },
          onDelete: async (id) => {
            await deleteItem(id);
            this.allItems = this.allItems.filter(it => it.id !== id);
            this.runSearchAndRender();
          },
        });
      },
      onQuickUpdateBox: async (item: CatalogItem, newBox: string) => {
        await updateBoxNumber(item.id, newBox);
        item.boxNumber = newBox;
        this.runSearchAndRender();
      },
      onCopyCode: (code: string) => {
        navigator.clipboard.writeText(code).catch(() => {});
      },
      onUpdatePrice: async (item: CatalogItem, newPrice: number) => {
        item.price = newPrice;
        await saveItem(item, true);
        const idx = this.allItems.findIndex(it => it.id === item.id);
        if (idx >= 0) this.allItems[idx] = item;
        this.runSearchAndRender();
      },
    };

    if (this.filters.viewMode === 'mural') {
      // Modo Mural Visual Comparador de Amostras
      this.productsContainer.className = 'w-full';
      renderProductMural(this.productsContainer, this.currentResults, cardCallbacks);
    } else {
      // Modo Grade Detalhada de Balcão
      this.productsContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
      for (const item of this.currentResults) {
        const cardEl = renderProductCard(item, this.filters.hidePrices, cardCallbacks);
        this.productsContainer.appendChild(cardEl);
      }
    }
  }
}

// Inicializa a aplicação ao carregar o DOM
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch(console.error);
});
