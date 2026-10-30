// Lightbox Modal Profissional com Zoom Dinâmico de 50% a 400%
// Indispensável para conferir trilhas de placas de circuito e pinos de soquetes

import { CatalogItem } from '../types/catalog';
import { icons } from './icons';

export class LightboxModal {
  private modalEl: HTMLElement | null = null;
  private currentZoom = 1.0;
  private panX = 0;
  private panY = 0;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private currentImageIndex = 0;
  private currentItem: CatalogItem | null = null;

  constructor() {
    this.createDom();
  }

  private createDom(): void {
    const existing = document.getElementById('lightbox-modal-root');
    if (existing) existing.remove();

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'lightbox-modal-root';
    this.modalEl.className = 'fixed inset-0 z-50 hidden bg-slate-950/90 backdrop-blur-md flex flex-col justify-between select-none';
    document.body.appendChild(this.modalEl);

    // Eventos globais de teclado
    window.addEventListener('keydown', (e) => {
      if (this.modalEl && !this.modalEl.classList.contains('hidden')) {
        if (e.key === 'Escape') this.close();
        if (e.key === '+' || e.key === '=') this.setZoom(this.currentZoom + 0.5);
        if (e.key === '-' || e.key === '_') this.setZoom(this.currentZoom - 0.5);
        if (e.key === '0') this.setZoom(1.0);
      }
    });
  }

  public open(item: CatalogItem, initialImageIndex = 0): void {
    this.currentItem = item;
    this.currentImageIndex = initialImageIndex;
    this.currentZoom = 1.0;
    this.panX = 0;
    this.panY = 0;

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

  private setZoom(zoom: number): void {
    this.currentZoom = Math.min(4.0, Math.max(0.5, Math.round(zoom * 10) / 10));
    this.updateImageTransform();
    this.updateZoomControls();
  }

  private updateImageTransform(): void {
    const img = this.modalEl?.querySelector('#lightbox-active-img') as HTMLImageElement | null;
    if (img) {
      img.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.currentZoom})`;
    }
  }

  private updateZoomControls(): void {
    const label = this.modalEl?.querySelector('#lightbox-zoom-val');
    if (label) label.textContent = `${Math.round(this.currentZoom * 100)}%`;
    const slider = this.modalEl?.querySelector('#lightbox-zoom-slider') as HTMLInputElement | null;
    if (slider) slider.value = String(this.currentZoom * 100);
  }

  private render(): void {
    if (!this.modalEl || !this.currentItem) return;

    const item = this.currentItem;
    const allImages = [item.primaryImage, ...item.additionalImages].filter(Boolean);
    const activeImage = allImages[this.currentImageIndex] || item.primaryImage || '/catalog-images/placeholder.webp';

    this.modalEl.innerHTML = `
      <!-- Header do Lightbox -->
      <div class="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-white z-10">
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-xl font-mono text-xl font-black ${item.macroCategory === 'circuito' ? 'bg-blue-600' : 'bg-amber-600'} text-white shadow">
            CX ${item.boxNumber}
          </span>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-lg font-black">${item.commercialCodeRaw}</span>
              ${item.circuitSpecs?.position ? `<span class="px-2 py-0.5 rounded text-xs font-bold bg-blue-900/60 text-blue-200 border border-blue-700">${item.circuitSpecs.position}</span>` : ''}
              ${item.socketSpecs?.lampType ? `<span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-900/60 text-emerald-200 border border-emerald-700">${item.socketSpecs.lampType}</span>` : ''}
            </div>
            <p class="text-xs text-slate-300 truncate max-w-xl">${item.title}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Botão Fechar -->
          <button id="btn-close-lightbox" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" title="Fechar (Esc)">
            ${icons.x("w-6 h-6")}
          </button>
        </div>
      </div>

      <!-- Área de Visualização com Pan & Drag -->
      <div id="lightbox-viewport" class="flex-1 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing bg-slate-950">
        <div class="relative bg-white rounded-2xl p-4 shadow-2xl max-w-4xl max-h-[75vh] flex items-center justify-center">
          <img
            id="lightbox-active-img"
            src="${activeImage}"
            alt="${item.title}"
            class="max-h-[68vh] max-w-full object-contain pointer-events-none transition-transform duration-75 ease-out"
            style="transform: translate(0px, 0px) scale(1);"
          />
        </div>
      </div>

      <!-- Barra Inferior: Controles de Zoom (50% a 400%) & Miniaturas -->
      <div class="px-4 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-white z-10">
        
        <!-- Miniaturas Multi-Ângulo -->
        <div class="flex items-center gap-2 overflow-x-auto">
          ${allImages.map((imgUrl, idx) => `
            <button
              class="lightbox-thumb w-12 h-12 rounded-xl border-2 ${idx === this.currentImageIndex ? 'border-blue-500' : 'border-slate-700'} p-0.5 bg-white shrink-0 overflow-hidden transition-all"
              data-idx="${idx}"
            >
              <img src="${imgUrl}" class="w-full h-full object-contain" />
            </button>
          `).join('')}
        </div>

        <!-- Controles de Zoom -->
        <div class="flex items-center gap-3 bg-slate-800/90 px-4 py-2 rounded-2xl border border-slate-700 shadow-inner">
          <button id="btn-zoom-out" class="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white" title="Reduzir (-)">
            ${icons.zoomOut("w-4 h-4")}
          </button>

          <input
            type="range"
            id="lightbox-zoom-slider"
            min="50"
            max="400"
            step="10"
            value="100"
            class="w-28 accent-blue-500 cursor-pointer"
          />

          <button id="btn-zoom-in" class="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white" title="Ampliar (+)">
            ${icons.zoomIn("w-4 h-4")}
          </button>

          <span id="lightbox-zoom-val" class="font-mono text-xs font-black min-w-[42px] text-center text-blue-400">100%</span>

          <div class="h-4 w-px bg-slate-700 mx-1"></div>

          <!-- Presets de Zoom -->
          <div class="flex items-center gap-1 text-[11px] font-bold">
            <button class="btn-zoom-preset px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600" data-zoom="1.0">100%</button>
            <button class="btn-zoom-preset px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600" data-zoom="2.0">200%</button>
            <button class="btn-zoom-preset px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500" data-zoom="4.0">400%</button>
            <button id="btn-zoom-reset" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 ml-1">Reset</button>
          </div>
        </div>

        <div class="text-[11px] text-slate-400 font-mono hidden md:block">
          Dica: Arraste com o mouse para mover. Use +/- para zoom.
        </div>

      </div>
    `;

    // Listeners
    this.modalEl.querySelector('#btn-close-lightbox')?.addEventListener('click', () => this.close());

    // Switch de miniaturas
    this.modalEl.querySelectorAll('.lightbox-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        this.currentImageIndex = parseInt((thumb as HTMLElement).dataset.idx || '0', 10);
        this.render();
      });
    });

    // Slider de Zoom
    const slider = this.modalEl.querySelector('#lightbox-zoom-slider') as HTMLInputElement | null;
    slider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value) / 100;
      this.setZoom(val);
    });

    this.modalEl.querySelector('#btn-zoom-in')?.addEventListener('click', () => this.setZoom(this.currentZoom + 0.5));
    this.modalEl.querySelector('#btn-zoom-out')?.addEventListener('click', () => this.setZoom(this.currentZoom - 0.5));
    this.modalEl.querySelector('#btn-zoom-reset')?.addEventListener('click', () => {
      this.panX = 0;
      this.panY = 0;
      this.setZoom(1.0);
    });

    this.modalEl.querySelectorAll('.btn-zoom-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat((btn as HTMLElement).dataset.zoom || '1.0');
        this.setZoom(val);
      });
    });

    // Pan & Drag no Viewport
    const viewport = this.modalEl.querySelector('#lightbox-viewport') as HTMLElement | null;
    if (viewport) {
      viewport.addEventListener('mousedown', (e) => {
        this.isDragging = true;
        this.startX = e.clientX - this.panX;
        this.startY = e.clientY - this.panY;
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.isDragging) return;
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        this.updateImageTransform();
      });

      window.addEventListener('mouseup', () => {
        this.isDragging = false;
      });

      // Scroll wheel zoom
      viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        this.setZoom(this.currentZoom + delta);
      }, { passive: false });
    }
  }
}

