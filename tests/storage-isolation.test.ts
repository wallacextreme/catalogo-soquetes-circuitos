import { describe, it, expect, beforeEach } from 'bun:test';
import { CatalogItem } from '../src/types/catalog';
import seedData from '../src/data/catalog-master-seed.json';

// In-Memory Mock de IndexedDB para execução em Bun CLI
class MockIDBStore {
  private data = new Map<string, any>();

  get(key: string) {
    const req: any = { result: this.data.get(key) };
    setTimeout(() => req.onsuccess?.({ target: req }), 0);
    return req;
  }

  getAll() {
    const req: any = { result: Array.from(this.data.values()) };
    setTimeout(() => req.onsuccess?.({ target: req }), 0);
    return req;
  }

  put(val: any) {
    this.data.set(val.id || val.key, val);
    const req: any = { result: val.id || val.key };
    setTimeout(() => req.onsuccess?.({ target: req }), 0);
    return req;
  }

  delete(key: string) {
    this.data.delete(key);
    const req: any = { result: undefined };
    setTimeout(() => req.onsuccess?.({ target: req }), 0);
    return req;
  }
}

class MockIDBDatabase {
  objectStoreNames = {
    contains: (name: string) => true,
  };
  private stores = new Map<string, MockIDBStore>();

  createObjectStore(name: string) {
    const s = new MockIDBStore();
    this.stores.set(name, s);
    return s;
  }

  transaction(storeNames: string | string[], mode: string) {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    const tx: any = {
      objectStore: (name: string) => {
        if (!this.stores.has(name)) this.stores.set(name, new MockIDBStore());
        return this.stores.get(name);
      },
      oncomplete: null,
      onerror: null,
    };
    setTimeout(() => tx.oncomplete?.(), 5);
    return tx;
  }
}

// Configura o mock global
const mockDb = new MockIDBDatabase();
(globalThis as any).indexedDB = {
  open: () => {
    const req: any = { result: mockDb };
    setTimeout(() => {
      req.onupgradeneeded?.({ target: req });
      req.onsuccess?.({ target: req });
    }, 0);
    return req;
  },
};

// Agora podemos importar as funções do IndexedDB
import {
  saveItem,
  getItemById,
  updateBoxNumber,
  syncStaticCatalogUpdates,
  exportBackup,
  importBackup,
} from '../src/storage/indexeddb';

describe('Gate 8 — Isolamento Inviolável dos Dados da Loja (IndexedDB)', () => {
  const seedItems = seedData.items as CatalogItem[];

  it('salva alterações manuais de Caixa e Código no IndexedDB sem perda', async () => {
    const targetItem = seedItems[0];
    const originalBox = targetItem.boxNumber;

    // Primeiro salva o item no banco
    await saveItem(targetItem, false);

    // Balconista altera a caixa da peça no balcão
    await updateBoxNumber(targetItem.id, 'CX-ESPECIAL-99');

    const updated = await getItemById(targetItem.id);
    expect(updated).toBeDefined();
    expect(updated?.boxNumber).toBe('CX-ESPECIAL-99');
    expect(updated?.boxNumber).not.toBe(originalBox);
  });

  it('garante que edições manuais NUNCA são sobrescritas ao sincronizar/recarregar o seed', async () => {
    const targetItem = seedItems[1];

    // Simula balconista editando preço e adicionando foto Ctrl+V
    const userEditedItem: CatalogItem = {
      ...targetItem,
      boxNumber: 'CX-MODIFICADA-88',
      price: 49.90,
      notes: 'Peça conferida fisicamente no balcão pelo gerente',
      additionalImages: ['data:image/webp;base64,samplephotoctrlv'],
    };

    await saveItem(userEditedItem, true);

    // Agora recarregamos o seed estático original de fábrica (como se o software fosse atualizado)
    const syncedItems = await syncStaticCatalogUpdates(seedItems);

    // Verifica que o item no banco ainda mantém os dados editados pelo balconista!
    const verifiedItem = syncedItems.find(it => it.id === targetItem.id);
    expect(verifiedItem).toBeDefined();
    expect(verifiedItem?.boxNumber).toBe('CX-MODIFICADA-88');
    expect(verifiedItem?.price).toBe(49.90);
    expect(verifiedItem?.notes).toBe('Peça conferida fisicamente no balcão pelo gerente');
    expect(verifiedItem?.additionalImages).toContain('data:image/webp;base64,samplephotoctrlv');
  });

  it('preserva novos itens cadastrados manualmente (isCustom) na loja', async () => {
    const customItem: CatalogItem = {
      id: 'custom-peca-especial-01',
      boxNumber: '999',
      internalCode: 'MU999',
      commercialCodeRaw: 'SPECIAL-SOQ-01',
      normalizedCode: 'specialsoq01',
      crossReferenceCodes: [],
      oemCodes: [],
      title: 'Soquete Customizado de Teste',
      descriptionRaw: 'Soquete adaptado para farol auxiliar',
      category: 'Soquetes Diversos',
      macroCategory: 'soquete',
      subCategory: 'Universal',
      circuitSpecs: null,
      socketSpecs: null,
      primaryImage: '/catalog-images/custom.webp',
      additionalImages: [],
      sourceDocument: 'Balcão',
      rowIndex: 999,
      slot: 'left',
      needsDescriptionReview: false,
      searchTokens: ['999', 'special-soq-01'],
      price: 25.00,
      notes: 'Item customizado',
      isCustom: true,
    };

    await saveItem(customItem, true);

    // Recarrega o seed de fábrica
    const synced = await syncStaticCatalogUpdates(seedItems);
    expect(synced.some(it => it.id === 'custom-peca-especial-01')).toBe(true);
  });

  it('exporta e importa backup mantendo integridade dos dados', async () => {
    const { payload, sha256, totalItems } = await exportBackup();
    expect(totalItems).toBeGreaterThan(0);
    expect(payload).toContain('items');
    expect(sha256).toHaveLength(64);

    const importRes = await importBackup(payload, sha256);
    expect(importRes.success).toBe(true);
    expect(importRes.importedCount).toBe(totalItems);
  });
});
