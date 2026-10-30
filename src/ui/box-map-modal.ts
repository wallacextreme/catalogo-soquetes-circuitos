// Mapa Geral de Caixas e Estoque Físico de Balcão
import { CatalogItem } from '../types/catalog';
import { icons } from './icons';

export class BoxMapModal {
  private modalEl: HTMLElement | null = null;
  private items: CatalogItem[] = [];
  private onSelectBoxCallback: ((boxNumber: string) => void) | null = null;

  constructor() {
    this.createDom();
  }

  private createDom(): void {
    const existing = document.getElementById('box-map-modal-root');
    if (existing) existing.remove();

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'box-map-modal-root';
    this.modalEl.className = 'fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6';
    document.body.appendChild(this.modalEl);

    window.addEventListener('keydown', (e) => {
      if (this.modalEl && !this.modalEl.classList.contains('hidden') && e.key === 'Escape') {
        this.close();
      }
    });
  }

  public open(items: CatalogItem[], onSelectBox: (boxNumber: string) => void): void {
    this.items = items;
    this.onSelectBoxCallback = onSelectBox;
    this.render();
    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  public close(): void {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  private render(): void {
    if (!this.modalEl) return;

    // Agrupa itens por Caixa
    const boxMap = new Map<string, CatalogItem[]>();
    for (const item of this.items) {
      const box = item.boxNumber.trim() || 'Sem Caixa';
      if (!boxMap.has(box)) boxMap.set(box, []);
      boxMap.get(box)!.push(item);
    }

    // Ordenação numérica de caixas
    const sortedBoxes = Array.from(boxMap.keys()).sort((a, b) => {
      const aNum = parseInt(a, 10);
      const bNum = parseInt(b, 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.localeCompare(b);
    });

    this.modalEl.innerHTML = `
      <div class="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        <!-- Header do Modal -->
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow">
              ${icons.map("w-6 h-6")}
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white leading-tight">
                MAPA GERAL DE CAIXAS DO ESTOQUE
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                ${sortedBoxes.length} caixas físicas cadastradas no balcão (${this.items.length} itens)
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-print-boxes" class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors">
              ${icons.printer("w-4 h-4")}
              <span>Imprimir / PDF</span>
            </button>
            <button id="btn-close-boxmap" class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              ${icons.x("w-5 h-5")}
            </button>
          </div>
        </div>

        <!-- Grade de Caixas -->
        <div class="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          ${sortedBoxes.map(box => {
            const boxItems = boxMap.get(box) || [];
            const hasCircuito = boxItems.some(it => it.macroCategory === 'circuito');
            const hasSoquete = boxItems.some(it => it.macroCategory === 'soquete');

            let headerBg = "bg-slate-700";
            if (hasCircuito && !hasSoquete) headerBg = "bg-blue-600";
            else if (!hasCircuito && hasSoquete) headerBg = "bg-amber-600";
            else if (hasCircuito && hasSoquete) headerBg = "bg-purple-600";

            return `
              <div
                class="box-cell bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-2.5 flex flex-col justify-between hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group"
                data-box="${box}"
              >
                <div>
                  <!-- Topo da Caixa -->
                  <div class="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700/60">
                    <span class="px-2 py-0.5 rounded-lg font-mono text-base font-black text-white ${headerBg}">
                      CX ${box}
                    </span>
                    <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      ${boxItems.length} ${boxItems.length === 1 ? 'peça' : 'peças'}
                    </span>
                  </div>

                  <!-- Miniaturas das peças dentro desta caixa -->
                  <div class="grid grid-cols-2 gap-1 py-2 bg-white dark:bg-slate-900/50 rounded-xl my-1 p-1">
                    ${boxItems.slice(0, 4).map(it => `
                      <div class="h-12 bg-white rounded flex items-center justify-center p-0.5 overflow-hidden">
                        <img src="${it.primaryImage || '/catalog-images/placeholder.webp'}" class="max-h-full max-w-full object-contain" />
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- Códigos presentes nesta caixa -->
                <div class="pt-1 text-[10px] font-mono text-slate-600 dark:text-slate-400 truncate">
                  ${boxItems.map(it => it.commercialCodeRaw).join(', ')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;

    // Listeners
    this.modalEl.querySelector('#btn-close-boxmap')?.addEventListener('click', () => this.close());
    this.modalEl.querySelector('#btn-print-boxes')?.addEventListener('click', () => window.print());

    this.modalEl.querySelectorAll('.box-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const box = (cell as HTMLElement).dataset.box;
        if (box && this.onSelectBoxCallback) {
          this.onSelectBoxCallback(box);
          this.close();
        }
      });
    });
  }
}

