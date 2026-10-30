// Modal de Backup & Sincronização SHA-256 (Disaster Recovery & Auditoria)
import { icons } from './icons';
import { exportBackup, importBackup } from '../storage/indexeddb';

export interface BackupModalCallbacks {
  onDataRestored: () => Promise<void>;
  onResetToFactorySeed: () => Promise<void>;
}

export class BackupModal {
  private modalEl: HTMLElement | null = null;
  private callbacks: BackupModalCallbacks | null = null;

  constructor() {
    this.createDom();
  }

  private createDom(): void {
    const existing = document.getElementById('backup-modal-root');
    if (existing) existing.remove();

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'backup-modal-root';
    this.modalEl.className = 'fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6';
    document.body.appendChild(this.modalEl);

    window.addEventListener('keydown', (e) => {
      if (this.modalEl && !this.modalEl.classList.contains('hidden') && e.key === 'Escape') {
        this.close();
      }
    });
  }

  public open(callbacks: BackupModalCallbacks): void {
    this.callbacks = callbacks;
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

    this.modalEl.innerHTML = `
      <div class="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow">
              ${icons.download("w-6 h-6")}
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white leading-tight">
                BACKUP & SEGURANÇA SHA-256
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Exportação, importação e integridade dos dados do balcão
              </p>
            </div>
          </div>

          <button id="btn-close-backup" class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            ${icons.x("w-5 h-5")}
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-5">
          
          <!-- Seção 1: Exportar Backup -->
          <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-black text-slate-900 dark:text-white">Exportar Backup Completo</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Salva todas as caixas, peças, códigos e fotos adicionadas em arquivo .json seguro
                </p>
              </div>
              <button
                id="btn-do-export"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
              >
                ${icons.download("w-4 h-4")}
                <span>Baixar .JSON</span>
              </button>
            </div>
            <div id="export-hash-box" class="hidden text-[11px] font-mono bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 break-all text-slate-600 dark:text-slate-300"></div>
          </div>

          <!-- Seção 2: Restaurar Backup -->
          <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">Restaurar de Backup</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Importa peças e caixas com verificação criptográfica SHA-256
              </p>
            </div>

            <div class="space-y-2">
              <input type="file" id="input-backup-file" accept=".json" class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <input
                type="text"
                id="input-expected-hash"
                placeholder="Hash SHA-256 esperado (opcional para conferir integridade)"
                class="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
              />
              <button
                id="btn-do-import"
                class="w-full py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-all"
              >
                Confirmar Importação
              </button>
            </div>
          </div>

          <!-- Seção 3: Restaurar Padrão de Fábrica (Seed) -->
          <div class="p-3 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/40 flex items-center justify-between">
            <div>
              <div class="text-xs font-black text-red-700 dark:text-red-400">Restaurar Seed Oficial</div>
              <div class="text-[11px] text-red-600 dark:text-red-400">Recarrega os 152 itens originais extraídos do Word</div>
            </div>
            <button
              id="btn-reset-seed"
              class="px-3 py-1.5 text-xs font-black bg-red-600 text-white hover:bg-red-700 rounded-xl transition-all"
            >
              Resetar Fábrica
            </button>
          </div>

        </div>

      </div>
    `;

    // Listeners
    this.modalEl.querySelector('#btn-close-backup')?.addEventListener('click', () => this.close());

    // Exportar
    this.modalEl.querySelector('#btn-do-export')?.addEventListener('click', async () => {
      const { payload, sha256, totalItems } = await exportBackup();
      const hashBox = this.modalEl?.querySelector('#export-hash-box') as HTMLElement | null;
      if (hashBox) {
        hashBox.classList.remove('hidden');
        hashBox.innerHTML = `<strong>SHA-256:</strong> ${sha256}<br><strong>Total de Peças:</strong> ${totalItems}`;
      }

      // Download
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-balcao-soquetes-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Importar
    this.modalEl.querySelector('#btn-do-import')?.addEventListener('click', async () => {
      const fileInput = this.modalEl?.querySelector('#input-backup-file') as HTMLInputElement | null;
      const hashInput = this.modalEl?.querySelector('#input-expected-hash') as HTMLInputElement | null;
      const file = fileInput?.files?.[0];
      if (!file) {
        alert('Selecione um arquivo .json para importar');
        return;
      }

      const text = await file.text();
      const expectedHash = hashInput?.value.trim() || undefined;

      const res = await importBackup(text, expectedHash);
      if (res.success) {
        alert(`Backup restaurado! ${res.importedCount} itens carregados.`);
        if (this.callbacks?.onDataRestored) {
          await this.callbacks.onDataRestored();
        }
        this.close();
      } else {
        alert(`Erro ao importar backup: ${res.message}`);
      }
    });

    // Reset de Fábrica
    this.modalEl.querySelector('#btn-reset-seed')?.addEventListener('click', async () => {
      if (confirm('Atenção: deseja restaurar a base original do catálogo? Suas edições locais serão substituídas pelos dados do documento Word original.')) {
        if (this.callbacks?.onResetToFactorySeed) {
          await this.callbacks.onResetToFactorySeed();
          this.close();
        }
      }
    });
  }
}
