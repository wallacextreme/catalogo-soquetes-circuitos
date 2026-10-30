// Modo Mural Visual Comparador de Amostra (Fotos Grandes para Balcão)
import { CatalogItem } from '../types/catalog';
import { CardCallbacks } from './product-card';
import { icons } from './icons';

export function renderProductMural(
  container: HTMLElement,
  items: CatalogItem[],
  callbacks: CardCallbacks
): void {
  container.innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-1">
      ${items.map(item => {
        const isCircuito = item.macroCategory === 'circuito';
        const boxBadgeBg = isCircuito ? "bg-blue-600 text-white" : "bg-amber-600 text-white";
        
        let sideText = '';
        if (isCircuito && item.circuitSpecs) {
          const pos = item.circuitSpecs.position;
          if (pos === 'LD' || pos === 'Central LD') sideText = 'LD';
          else if (pos === 'LE' || pos === 'Central LE') sideText = 'LE';
          else sideText = 'LD/LE';
        }

        return `
          <div
            class="mural-card bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col cursor-pointer group"
            data-id="${item.id}"
          >
            <!-- Badge Gigante de Caixa Flutuante -->
            <div class="p-2 pb-0 flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-xl font-mono text-lg font-black ${boxBadgeBg} shadow-sm">
                CX ${item.boxNumber}
              </span>
              ${sideText ? `<span class="px-2 py-0.5 rounded text-[11px] font-black ${sideText === 'LD' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'}">${sideText}</span>` : ''}
            </div>

            <!-- Imagem Grande de Amostra -->
            <div class="p-3 bg-white flex items-center justify-center h-44 overflow-hidden relative">
              <img
                src="${item.primaryImage || '/catalog-images/placeholder.webp'}"
                alt="${item.title}"
                class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span class="bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow flex items-center gap-1">
                  ${icons.zoomIn("w-3.5 h-3.5")}
                  <span>Comparar Zoom</span>
                </span>
              </div>
            </div>

            <!-- Rodapé Compacto -->
            <div class="p-2.5 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700/60 flex flex-col justify-between flex-1">
              <div class="font-mono text-xs font-black text-slate-900 dark:text-white truncate">
                ${item.commercialCodeRaw}
              </div>
              <div class="text-[11px] text-slate-600 dark:text-slate-300 truncate pt-0.5">
                ${item.title}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Listener para clique no card do mural -> abre Lightbox imediatamente para conferir bicos/trilhas
  const itemMap = new Map(items.map(it => [it.id, it]));
  container.querySelectorAll('.mural-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = (card as HTMLElement).dataset.id;
      if (id && itemMap.has(id)) {
        callbacks.onOpenLightbox(itemMap.get(id)!, 0);
      }
    });
  });
}
