// Modal CRUD Completo de Cadastro e Edição de Peças de Balcão (+ Foto Ctrl+V)
import { CatalogItem, MacroCategory } from '../types/catalog';
import { icons } from './icons';
import { convertBlobToStudioWebp, extractImageFromClipboard } from '../media/webp-converter';

export interface ProductFormCallbacks {
  onSave: (item: CatalogItem) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export class ProductFormModal {
  private modalEl: HTMLElement | null = null;
  private currentItem: CatalogItem | null = null;
  private isNew = false;
  private callbacks: ProductFormCallbacks | null = null;
  private currentImages: string[] = [];

  constructor() {
    this.createDom();
  }

  private createDom(): void {
    const existing = document.getElementById('product-form-modal-root');
    if (existing) existing.remove();

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'product-form-modal-root';
    this.modalEl.className = 'fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto';
    document.body.appendChild(this.modalEl);

    // Listener global de Ctrl+V quando modal está aberto
    window.addEventListener('paste', async (e) => {
      if (this.modalEl && !this.modalEl.classList.contains('hidden')) {
        const file = extractImageFromClipboard(e);
        if (file) {
          e.preventDefault();
          await this.handleImageFile(file);
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if (this.modalEl && !this.modalEl.classList.contains('hidden') && e.key === 'Escape') {
        this.close();
      }
    });
  }

  public open(item: CatalogItem | null, callbacks: ProductFormCallbacks): void {
    this.callbacks = callbacks;
    this.isNew = item === null;
    if (item) {
      this.currentItem = JSON.parse(JSON.stringify(item));
      this.currentImages = [item.primaryImage, ...item.additionalImages].filter(Boolean);
    } else {
      this.currentItem = {
        id: `custom-${Date.now()}`,
        boxNumber: '',
        internalCode: null,
        commercialCodeRaw: '',
        normalizedCode: '',
        crossReferenceCodes: [],
        oemCodes: [],
        title: '',
        descriptionRaw: '',
        category: 'Soquetes Diversos',
        macroCategory: 'soquete',
        subCategory: 'Soquetes Universais e Diversos',
        circuitSpecs: null,
        socketSpecs: {
          lampType: '1 Polo (BA15s)',
          poles: 1,
          pinType: 'Pino Reto (180°)',
          wires: '2 Fios',
          material: 'Nylon',
          baseStyle: null,
          make: 'Universal',
        },
        primaryImage: '',
        additionalImages: [],
        sourceDocument: 'Cadastro Manual Loja',
        rowIndex: 0,
        slot: 'left',
        needsDescriptionReview: false,
        searchTokens: [],
        price: null,
        notes: '',
        isCustom: true,
      };
      this.currentImages = [];
    }

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

  private async handleImageFile(file: File | Blob): Promise<void> {
    try {
      const dropZone = this.modalEl?.querySelector('#photo-drop-zone');
      if (dropZone) dropZone.classList.add('opacity-50');

      const result = await convertBlobToStudioWebp(file, 1600, 0.96);
      this.currentImages.push(result.webpDataUrl);
      this.renderImageList();

      if (dropZone) dropZone.classList.remove('opacity-50');
    } catch (err) {
      alert(`Erro ao processar imagem: ${(err as Error).message}`);
    }
  }

  private renderImageList(): void {
    const listEl = this.modalEl?.querySelector('#product-image-list');
    if (!listEl) return;

    if (this.currentImages.length === 0) {
      listEl.innerHTML = `<span class="text-xs text-slate-400 italic">Nenhuma foto adicionada ainda. Use Ctrl+V para colar um print!</span>`;
      return;
    }

    listEl.innerHTML = this.currentImages.map((imgUrl, idx) => `
      <div class="relative w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1 overflow-hidden group">
        <img src="${imgUrl}" class="w-full h-full object-contain" />
        <button
          class="btn-remove-img absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          data-idx="${idx}"
          title="Remover foto"
        >
          ${icons.trash("w-3 h-3")}
        </button>
        ${idx === 0 ? `<span class="absolute bottom-1 left-1 px-1 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white">Principal</span>` : ''}
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-remove-img').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt((btn as HTMLElement).dataset.idx || '0', 10);
        this.currentImages.splice(idx, 1);
        this.renderImageList();
      });
    });
  }

  private render(): void {
    if (!this.modalEl || !this.currentItem) return;

    const item = this.currentItem;
    const isCircuito = item.macroCategory === 'circuito';

    this.modalEl.innerHTML = `
      <div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col my-auto overflow-hidden">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow">
              ${isCircuito ? icons.circuit("w-6 h-6") : icons.socket("w-6 h-6")}
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white leading-tight">
                ${this.isNew ? 'CADASTRAR NOVA PEÇA NO BALCÃO' : `EDITAR PEÇA: ${item.commercialCodeRaw}`}
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Localização física, especificações técnicas e galeria multi-ângulo
              </p>
            </div>
          </div>

          <button id="btn-close-form" class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            ${icons.x("w-5 h-5")}
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          <!-- Linha 1: Caixa e Código Principal -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                Número da Caixa (Física) *
              </label>
              <input
                type="text"
                id="input-box"
                value="${item.boxNumber}"
                class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-black text-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="Ex: 05, 73, 112"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                Código Principal *
              </label>
              <input
                type="text"
                id="input-code"
                value="${item.commercialCodeRaw}"
                class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-black text-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="Ex: ETE-7491, DP-3015"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                Código Interno (Loja)
              </label>
              <input
                type="text"
                id="input-internal-code"
                value="${item.internalCode || ''}"
                class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="Ex: MU392, SQ102"
              />
            </div>
          </div>

          <!-- Linha 2: Tipo de Peça e Montadora -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Macro-Categoria</label>
              <select
                id="select-macro"
                class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="circuito" ${isCircuito ? 'selected' : ''}>Placa de Circuito de Lanterna</option>
                <option value="soquete" ${!isCircuito ? 'selected' : ''}>Soquetes Automotivos Diversos</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Montadora Principal</label>
              <input
                type="text"
                id="input-make"
                value="${item.circuitSpecs?.make || item.socketSpecs?.make || 'Universal'}"
                class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="VW, Fiat, GM, Ford, Honda..."
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Preço Balcão (R$)</label>
              <input
                type="number"
                step="0.01"
                id="input-price"
                value="${item.price !== null && item.price !== undefined ? item.price : ''}"
                class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="0,00"
              />
            </div>
          </div>

          <!-- Linha 3: Especificações Específicas de Circuito vs Soquete -->
          <div id="dynamic-specs-container">
            ${
              isCircuito
                ? `
                <div class="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-900/50 space-y-3">
                  <div class="text-xs font-black uppercase text-blue-700 dark:text-blue-300">Especificações de Placa de Circuito</div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Lado / Posição</label>
                      <select id="select-pos" class="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold">
                        <option value="LD" ${item.circuitSpecs?.position === 'LD' ? 'selected' : ''}>LD (Lado Direito / Passageiro)</option>
                        <option value="LE" ${item.circuitSpecs?.position === 'LE' ? 'selected' : ''}>LE (Lado Esquerdo / Motorista)</option>
                        <option value="LD/LE (Ambos)" ${item.circuitSpecs?.position?.includes('Ambos') ? 'selected' : ''}>Par / Ambos (LD/LE)</option>
                        <option value="Central" ${item.circuitSpecs?.position?.includes('Central') ? 'selected' : ''}>Central</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sistema da Lanterna</label>
                      <input type="text" id="input-system" value="${item.circuitSpecs?.lanternSystem || ''}" class="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs" placeholder="Arteb, Cibié, VDO, Marelli..." />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Anos / Geração</label>
                      <input type="text" id="input-years" value="${item.circuitSpecs?.years || ''}" class="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs" placeholder="95/00, G2/G3, 04/..." />
                    </div>
                  </div>
                </div>
                `
                : `
                <div class="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-3">
                  <div class="text-xs font-black uppercase text-amber-700 dark:text-amber-300">Especificações de Soquete</div>
                  <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Polos</label>
                      <select id="select-poles" class="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold">
                        <option value="1" ${item.socketSpecs?.poles === 1 ? 'selected' : ''}>1 Polo</option>
                        <option value="2" ${item.socketSpecs?.poles === 2 ? 'selected' : ''}>2 Polos</option>
                        <option value="" ${!item.socketSpecs?.poles ? 'selected' : ''}>Outro / Sem Polo</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Lâmpada</label>
                      <input type="text" id="input-lamp" value="${item.socketSpecs?.lampType || ''}" class="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs" placeholder="H7, H4, T10, 69, 1 Polo..." />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Pinos</label>
                      <input type="text" id="input-pins" value="${item.socketSpecs?.pinType || ''}" class="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs" placeholder="Pino Reto, Pino Desencontrado..." />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Material</label>
                      <input type="text" id="input-material" value="${item.socketSpecs?.material || ''}" class="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs" placeholder="Nylon, Porcelana, Metal..." />
                    </div>
                  </div>
                </div>
                `
            }
          </div>

          <!-- Linha 4: Título e Descrição Completa -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descrição e Aplicação Veicular *
            </label>
            <textarea
              id="input-desc"
              rows="2"
              class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Ex: SOQUETE PISCA GOL G3 1POLO PINO DOIDO..."
              required
            >${item.descriptionRaw}</textarea>
          </div>

          <!-- Linha 5: Códigos Cruzados e OEM -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Códigos Cruzados / Conversões (separados por vírgula)
              </label>
              <input
                type="text"
                id="input-cross-codes"
                value="${item.crossReferenceCodes.join(', ')}"
                class="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="Ex: ETE-7900, TC-1020, DP-2006"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Códigos Originais OEM (separados por vírgula)
              </label>
              <input
                type="text"
                id="input-oem-codes"
                value="${item.oemCodes.join(', ')}"
                class="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="Ex: 90.047.485, 131.941.117-1"
              />
            </div>
          </div>

          <!-- Linha 6: Galeria de Fotos Multi-Ângulo (+ Ctrl+V Instantâneo) -->
          <div>
            <div class="flex items-center justify-between pb-1">
              <label class="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                Fotos da Peça (.WebP Studio)
              </label>
              <span class="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                Pressione Ctrl+V em qualquer lugar da tela para colar uma foto!
              </span>
            </div>

            <!-- Drop Zone / Upload Area -->
            <div
              id="photo-drop-zone"
              class="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-800/40 cursor-pointer flex flex-col items-center justify-center gap-1.5"
            >
              <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                ${icons.imagePlus("w-5 h-5")}
              </div>
              <p class="text-xs font-bold text-slate-700 dark:text-slate-300">
                Arraste fotos aqui, clique para selecionar ou cole direto com <span class="font-mono text-blue-600 font-black">Ctrl+V</span>
              </p>
              <p class="text-[11px] text-slate-400">
                Composição automática com fundo branco puro (#FFFFFF) e WebP Studio
              </p>
              <input type="file" id="input-file-photo" accept="image/*" multiple class="hidden" />
            </div>

            <!-- Lista de Fotos Adicionadas -->
            <div id="product-image-list" class="flex items-center gap-2 mt-3 overflow-x-auto pb-1"></div>
          </div>

        </div>

        <!-- Footer com Botões de Ação -->
        <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            ${
              !this.isNew && this.callbacks?.onDelete
                ? `<button id="btn-delete-item" class="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-1.5 transition-colors">
                    ${icons.trash("w-4 h-4")}
                    <span>Excluir Peça</span>
                  </button>`
                : ''
            }
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-cancel-form" class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button id="btn-save-form" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-1.5">
              ${icons.check("w-4 h-4")}
              <span>Salvar no Balcão</span>
            </button>
          </div>
        </div>

      </div>
    `;

    this.renderImageList();

    // Listeners
    this.modalEl.querySelector('#btn-close-form')?.addEventListener('click', () => this.close());
    this.modalEl.querySelector('#btn-cancel-form')?.addEventListener('click', () => this.close());

    // Toggle de Macro Categoria dinâmico
    const macroSelect = this.modalEl.querySelector('#select-macro') as HTMLSelectElement | null;
    macroSelect?.addEventListener('change', () => {
      this.currentItem!.macroCategory = macroSelect.value as MacroCategory;
      this.render();
    });

    // Upload via File Input
    const dropZone = this.modalEl.querySelector('#photo-drop-zone');
    const fileInput = this.modalEl.querySelector('#input-file-photo') as HTMLInputElement | null;
    dropZone?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', async () => {
      if (fileInput.files) {
        for (let i = 0; i < fileInput.files.length; i++) {
          await this.handleImageFile(fileInput.files[i]);
        }
      }
    });

    // Drag and Drop
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-500', 'bg-blue-50/50');
    });

    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
    });

    dropZone?.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
      const dt = (e as DragEvent).dataTransfer;
      if (dt && dt.files) {
        for (let i = 0; i < dt.files.length; i++) {
          await this.handleImageFile(dt.files[i]);
        }
      }
    });

    // Deletar item
    this.modalEl.querySelector('#btn-delete-item')?.addEventListener('click', async () => {
      if (confirm(`Tem certeza que deseja excluir a peça ${item.commercialCodeRaw}?`)) {
        if (this.callbacks?.onDelete) {
          await this.callbacks.onDelete(item.id);
          this.close();
        }
      }
    });

    // Salvar
    this.modalEl.querySelector('#btn-save-form')?.addEventListener('click', async () => {
      await this.saveFormData();
    });
  }

  private async saveFormData(): Promise<void> {
    if (!this.modalEl || !this.currentItem || !this.callbacks) return;

    const boxInput = this.modalEl.querySelector('#input-box') as HTMLInputElement | null;
    const codeInput = this.modalEl.querySelector('#input-code') as HTMLInputElement | null;
    const descInput = this.modalEl.querySelector('#input-desc') as HTMLTextAreaElement | null;
    const internalInput = this.modalEl.querySelector('#input-internal-code') as HTMLInputElement | null;
    const priceInput = this.modalEl.querySelector('#input-price') as HTMLInputElement | null;
    const crossInput = this.modalEl.querySelector('#input-cross-codes') as HTMLInputElement | null;
    const oemInput = this.modalEl.querySelector('#input-oem-codes') as HTMLInputElement | null;
    const makeInput = this.modalEl.querySelector('#input-make') as HTMLInputElement | null;

    if (!boxInput?.value.trim() || !codeInput?.value.trim() || !descInput?.value.trim()) {
      alert('Por favor, preencha Caixa, Código Principal e Descrição.');
      return;
    }

    const box = boxInput.value.trim();
    const code = codeInput.value.trim();
    const desc = descInput.value.trim();
    const make = makeInput?.value.trim() || 'Universal';

    this.currentItem.boxNumber = box;
    this.currentItem.commercialCodeRaw = code;
    this.currentItem.normalizedCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
    this.currentItem.descriptionRaw = desc;
    this.currentItem.title = desc.split('\n')[0].substring(0, 80);
    this.currentItem.internalCode = internalInput?.value.trim() || null;
    this.currentItem.price = priceInput?.value ? parseFloat(priceInput.value) : null;

    this.currentItem.crossReferenceCodes = (crossInput?.value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    this.currentItem.oemCodes = (oemInput?.value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Imagens
    if (this.currentImages.length > 0) {
      this.currentItem.primaryImage = this.currentImages[0];
      this.currentItem.additionalImages = this.currentImages.slice(1);
    }

    // Specs
    if (this.currentItem.macroCategory === 'circuito') {
      const posSelect = this.modalEl.querySelector('#select-pos') as HTMLSelectElement | null;
      const sysInput = this.modalEl.querySelector('#input-system') as HTMLInputElement | null;
      const yearsInput = this.modalEl.querySelector('#input-years') as HTMLInputElement | null;
      this.currentItem.circuitSpecs = {
        position: posSelect?.value || 'LD/LE (Ambos)',
        positionBadge: posSelect?.value || 'Ambos (LD/LE)',
        lanternSystem: sysInput?.value.trim() || null,
        make,
        years: yearsInput?.value.trim() || null,
      };
      this.currentItem.socketSpecs = null;
    } else {
      const polesSelect = this.modalEl.querySelector('#select-poles') as HTMLSelectElement | null;
      const lampInput = this.modalEl.querySelector('#input-lamp') as HTMLInputElement | null;
      const pinsInput = this.modalEl.querySelector('#input-pins') as HTMLInputElement | null;
      const matInput = this.modalEl.querySelector('#input-material') as HTMLInputElement | null;
      this.currentItem.socketSpecs = {
        lampType: lampInput?.value.trim() || null,
        poles: polesSelect?.value ? parseInt(polesSelect.value, 10) : null,
        pinType: pinsInput?.value.trim() || null,
        wires: null,
        material: matInput?.value.trim() || null,
        baseStyle: null,
        make,
      };
      this.currentItem.circuitSpecs = null;
    }

    // Atualiza searchTokens
    const tokens = new Set<string>();
    tokens.add(box);
    tokens.add(`CX ${box}`);
    tokens.add(`CAIXA ${box}`);
    tokens.add(code.toUpperCase());
    tokens.add(code.toLowerCase());
    tokens.add(code.replace(/[^a-zA-Z0-9]/g, ''));
    if (this.currentItem.internalCode) tokens.add(this.currentItem.internalCode);
    for (const c of this.currentItem.crossReferenceCodes) tokens.add(c);
    for (const o of this.currentItem.oemCodes) tokens.add(o);
    for (const word of desc.toLowerCase().split(/\s+/)) {
      if (word.length >= 2) tokens.add(word);
    }
    this.currentItem.searchTokens = Array.from(tokens);

    await this.callbacks.onSave(this.currentItem);
    this.close();
  }
}
