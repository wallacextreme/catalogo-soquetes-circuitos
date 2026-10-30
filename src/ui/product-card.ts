// Card de Produto Padrão Ouro (UX Balcão Industrial + Badge Gigante de Caixa + LD/LE)
import { CatalogItem } from '../types/catalog';
import { icons } from './icons';

export interface CardCallbacks {
  onOpenLightbox: (item: CatalogItem, initialImageIndex?: number) => void;
  onEditProduct: (item: CatalogItem) => void;
  onQuickUpdateBox: (item: CatalogItem, newBox: string) => void;
  onCopyCode: (code: string) => void;
}

export function renderProductCard(
  item: CatalogItem,
  hidePrices: boolean,
  callbacks: CardCallbacks
): HTMLElement {
  const card = document.createElement('div');
  card.className = "bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group";

  // Identificação da Caixa & Cores de Alto Contraste
  const isCircuito = item.macroCategory === 'circuito';
  const boxBadgeBg = isCircuito
    ? "bg-blue-600 dark:bg-blue-500 text-white"
    : "bg-amber-600 dark:bg-amber-500 text-white";

  // Badges semânticos de lado LD / LE
  let sideBadgeHtml = '';
  if (isCircuito && item.circuitSpecs) {
    const pos = item.circuitSpecs.position;
    if (pos === 'LD' || pos === 'Central LD') {
      sideBadgeHtml = `<span class="px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300 dark:border-blue-700">LD (Passageiro)</span>`;
    } else if (pos === 'LE' || pos === 'Central LE') {
      sideBadgeHtml = `<span class="px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">LE (Motorista)</span>`;
    } else {
      sideBadgeHtml = `<span class="px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">Par (LD/LE)</span>`;
    }
  }

  // Badges de soquetes
  let socketBadgesHtml = '';
  if (!isCircuito && item.socketSpecs) {
    const specs = item.socketSpecs;
    if (specs.poles) {
      socketBadgesHtml += `<span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">${specs.poles} Polo${specs.poles > 1 ? 's' : ''}</span>`;
    }
    if (specs.lampType) {
      socketBadgesHtml += `<span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">${specs.lampType}</span>`;
    }
    if (specs.pinType) {
      socketBadgesHtml += `<span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">${specs.pinType}</span>`;
    }
    if (specs.material) {
      socketBadgesHtml += `<span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">${specs.material}</span>`;
    }
  }

  // Galeria de imagens
  const allImages = [item.primaryImage, ...item.additionalImages].filter(Boolean);

  card.innerHTML = `
    <!-- Topo do Card: Localizador Físico nº 1 (Badge Gigante de Caixa) -->
    <div class="p-3.5 pb-2 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/50">
      
      <!-- Caixa Gigante em Alto Contraste -->
      <div class="flex items-center gap-1.5">
        <button
          class="btn-quick-box flex items-center gap-2 px-3 py-1 rounded-xl font-mono text-xl sm:text-2xl font-black ${boxBadgeBg} shadow-sm transition-transform active:scale-95 group/box"
          title="Clique para alterar rapidamente a Caixa física desta peça"
        >
          <span class="text-xs uppercase font-extrabold tracking-wider opacity-85">CX</span>
          <span>${item.boxNumber || '--'}</span>
          <span class="opacity-0 group-hover/box:opacity-100 transition-opacity text-white/80">
            ${icons.edit("w-3.5 h-3.5")}
          </span>
        </button>

        ${
          item.internalCode
            ? `<span class="px-2 py-1 rounded-lg font-mono text-xs font-black bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200" title="Código Interno da Loja">${item.internalCode}</span>`
            : ''
        }
      </div>

      <!-- Macro-Categoria & Status -->
      <div class="flex items-center gap-1.5">
        ${sideBadgeHtml}
        ${
          item.circuitSpecs?.lanternSystem
            ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200">${item.circuitSpecs.lanternSystem}</span>`
            : ''
        }
      </div>
    </div>

    <!-- Foto do Produto (Studio WebP com Fundo Branco Puro #FFFFFF) -->
    <div class="relative bg-white p-3 flex items-center justify-center min-h-[190px] max-h-[220px] overflow-hidden cursor-zoom-in group/img">
      <img
        src="${item.primaryImage || '/catalog-images/placeholder.webp'}"
        alt="${item.title}"
        class="max-h-[185px] w-auto max-w-full object-contain transition-transform duration-300 group-hover/img:scale-105"
        loading="lazy"
      />

      <!-- Overlay de Ação Rápida de Zoom -->
      <div class="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-semibold shadow">
        ${icons.zoomIn("w-3.5 h-3.5")}
        <span>Zoom 400%</span>
      </div>

      ${
        allImages.length > 1
          ? `<div class="absolute top-2 left-2 bg-slate-900/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold">
              ${allImages.length} fotos
            </div>`
          : ''
      }
    </div>

    <!-- Miniaturas Adicionais (se houver fotos adicionais via Ctrl+V ou Playwright) -->
    ${
      allImages.length > 1
        ? `
        <div class="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-t border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-1.5 overflow-x-auto">
          ${allImages.map((imgUrl, idx) => `
            <button
              class="thumb-switch w-10 h-10 rounded-lg border-2 ${idx === 0 ? 'border-blue-600' : 'border-slate-200 dark:border-slate-700'} p-0.5 bg-white shrink-0 overflow-hidden"
              data-img="${imgUrl}"
              data-idx="${idx}"
            >
              <img src="${imgUrl}" class="w-full h-full object-contain" />
            </button>
          `).join('')}
        </div>
        `
        : ''
    }

    <!-- Conteúdo Textual: Códigos, Descrição e Aplicação -->
    <div class="p-3.5 flex-1 flex flex-col justify-between space-y-2">
      
      <div>
        <!-- Código Principal Comercial -->
        <div class="flex items-center justify-between gap-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-mono text-base font-black text-slate-900 dark:text-white tracking-tight">
              ${item.commercialCodeRaw}
            </span>
            <button
              class="btn-copy-code p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
              title="Copiar código"
              data-code="${item.commercialCodeRaw}"
            >
              ${icons.copy("w-3.5 h-3.5")}
            </button>
          </div>

          <!-- Montadora -->
          ${
            item.circuitSpecs?.make || item.socketSpecs?.make
              ? `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  ${item.circuitSpecs?.make || item.socketSpecs?.make}
                </span>`
              : ''
          }
        </div>

        <!-- Códigos Cruzados / Conversões / OEM -->
        ${
          item.crossReferenceCodes.length > 0 || item.oemCodes.length > 0
            ? `
            <div class="flex items-center gap-1 flex-wrap pt-1 text-[11px]">
              ${item.crossReferenceCodes.map(c => `
                <span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-mono font-medium">${c}</span>
              `).join('')}
              ${item.oemCodes.map(o => `
                <span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-mono" title="Código Original OEM">OEM: ${o}</span>
              `).join('')}
            </div>
            `
            : ''
        }

        <!-- Badges Técnicos de Soquete -->
        ${socketBadgesHtml ? `<div class="flex items-center gap-1 flex-wrap pt-1.5">${socketBadgesHtml}</div>` : ''}

        <!-- Título / Descrição Limpa -->
        <p class="text-xs font-semibold text-slate-700 dark:text-slate-200 pt-1 line-clamp-2 leading-relaxed">
          ${item.title}
        </p>
      </div>

      <!-- Rodapé do Card: Preço e Botão de Edição/+ Foto -->
      <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <!-- Preço Opcional -->
        <div>
          ${
            !hidePrices && item.price !== null && item.price !== undefined
              ? `<div class="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                  R$ ${item.price.toFixed(2).replace('.', ',')}
                </div>`
              : `<span class="text-[11px] text-slate-400 dark:text-slate-500 font-mono">Consulte balcão</span>`
          }
        </div>

        <!-- Ação Editar / + Foto Ctrl+V -->
        <button
          class="btn-edit-product px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors"
          title="Editar peça ou colar foto Ctrl+V"
        >
          ${icons.edit("w-3.5 h-3.5")}
          <span>Editar</span>
        </button>
      </div>

    </div>
  `;

  // Listeners
  // 1. Zoom na imagem principal
  card.querySelector('.cursor-zoom-in')?.addEventListener('click', () => {
    callbacks.onOpenLightbox(item, 0);
  });

  // 2. Troca de miniatura
  card.querySelectorAll('.thumb-switch').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetImg = (thumb as HTMLElement).dataset.img;
      const idx = parseInt((thumb as HTMLElement).dataset.idx || '0', 10);
      const mainImg = card.querySelector('.cursor-zoom-in img') as HTMLImageElement | null;
      if (mainImg && targetImg) {
        mainImg.src = targetImg;
      }
      callbacks.onOpenLightbox(item, idx);
    });
  });

  // 3. Edição Rápida da Caixa
  card.querySelector('.btn-quick-box')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentBox = item.boxNumber;
    const newBox = prompt(`Alterar localização física para a peça ${item.commercialCodeRaw}:`, currentBox);
    if (newBox !== null && newBox.trim() !== '' && newBox.trim() !== currentBox) {
      callbacks.onQuickUpdateBox(item, newBox.trim());
    }
  });

  // 4. Copiar Código
  card.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = (btn as HTMLElement).dataset.code || '';
      callbacks.onCopyCode(code);
      btn.innerHTML = icons.check("w-3.5 h-3.5 text-emerald-500");
      setTimeout(() => {
        btn.innerHTML = icons.copy("w-3.5 h-3.5");
      }, 1500);
    });
  });

  // 5. Editar Modal
  card.querySelector('.btn-edit-product')?.addEventListener('click', () => {
    callbacks.onEditProduct(item);
  });

  return card;
}
