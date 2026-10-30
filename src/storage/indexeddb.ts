// Storage Layer IndexedDB com Isolamento Inviolável de Dados (Gate 8 Padrão Ouro)
// Edições manuais de balcão e fotos Ctrl+V NUNCA são perdidas ao atualizar o seed.

import { CatalogItem } from '../types/catalog';

const DB_NAME = 'BalcaoSoquetesDB';
const DB_VERSION = 1;
const STORE_ITEMS = 'catalog_items';
const STORE_OVERRIDES = 'user_overrides';
const STORE_SETTINGS = 'app_settings';

interface UserOverrideRecord {
  id: string;
  isCustom?: boolean;
  boxNumber?: string;
  internalCode?: string | null;
  commercialCodeRaw?: string;
  crossReferenceCodes?: string[];
  oemCodes?: string[];
  price?: number | null;
  notes?: string;
  additionalImages?: string[];
  primaryImage?: string;
  descriptionRaw?: string;
  title?: string;
  updatedAt: string;
}

let dbInstance: IDBDatabase | null = null;

export async function computeSHA256(data: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(data));
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_OVERRIDES)) {
        db.createObjectStore(STORE_OVERRIDES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(new Error(`Erro ao abrir IndexedDB: ${request.error?.message}`));
    };
  });
}

export async function getAllItems(): Promise<CatalogItem[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ITEMS, 'readonly');
    const store = tx.objectStore(STORE_ITEMS);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as CatalogItem[]);
    };

    request.onerror = () => {
      reject(new Error(`Erro ao obter itens: ${request.error?.message}`));
    };
  });
}

export async function getItemById(id: string): Promise<CatalogItem | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ITEMS, 'readonly');
    const store = tx.objectStore(STORE_ITEMS);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as CatalogItem | undefined);
    };

    request.onerror = () => {
      reject(new Error(`Erro ao obter item ${id}: ${request.error?.message}`));
    };
  });
}

export async function saveItem(item: CatalogItem, isUserAction = true): Promise<void> {
  const db = await openDatabase();
  const now = new Date().toISOString();
  item.updatedAt = now;

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_ITEMS, STORE_OVERRIDES], 'readwrite');
    const itemsStore = tx.objectStore(STORE_ITEMS);
    const overridesStore = tx.objectStore(STORE_OVERRIDES);

    itemsStore.put(item);

    if (isUserAction) {
      const overrideRecord: UserOverrideRecord = {
        id: item.id,
        isCustom: item.isCustom ?? false,
        boxNumber: item.boxNumber,
        internalCode: item.internalCode,
        commercialCodeRaw: item.commercialCodeRaw,
        crossReferenceCodes: item.crossReferenceCodes,
        oemCodes: item.oemCodes,
        price: item.price,
        notes: item.notes,
        additionalImages: item.additionalImages,
        primaryImage: item.primaryImage,
        descriptionRaw: item.descriptionRaw,
        title: item.title,
        updatedAt: now,
      };
      overridesStore.put(overrideRecord);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error(`Erro ao salvar item: ${tx.error?.message}`));
  });
}

export async function updateBoxNumber(id: string, newBoxNumber: string): Promise<void> {
  const item = await getItemById(id);
  if (!item) throw new Error(`Item ${id} não encontrado`);

  item.boxNumber = newBoxNumber.trim();
  // Atualiza tokens de busca
  if (!item.searchTokens.includes(item.boxNumber)) {
    item.searchTokens.push(item.boxNumber);
    item.searchTokens.push(`CX ${item.boxNumber}`);
    item.searchTokens.push(`CAIXA ${item.boxNumber}`);
  }
  await saveItem(item, true);
}

export async function deleteItem(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_ITEMS, STORE_OVERRIDES], 'readwrite');
    tx.objectStore(STORE_ITEMS).delete(id);
    tx.objectStore(STORE_OVERRIDES).delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error(`Erro ao deletar item: ${tx.error?.message}`));
  });
}

/**
 * Gate 8 — Sincronização Segura do Seed:
 * Mescla os dados do seed preservando 100% das alterações do usuário.
 */
export async function syncStaticCatalogUpdates(seedItems: CatalogItem[]): Promise<CatalogItem[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_ITEMS, STORE_OVERRIDES], 'readwrite');
    const itemsStore = tx.objectStore(STORE_ITEMS);
    const overridesStore = tx.objectStore(STORE_OVERRIDES);

    const overridesReq = overridesStore.getAll();
    const existingReq = itemsStore.getAll();

    overridesReq.onsuccess = () => {
      const overridesList = (overridesReq.result || []) as UserOverrideRecord[];
      const overridesMap = new Map<string, UserOverrideRecord>();
      for (const ov of overridesList) {
        overridesMap.set(ov.id, ov);
      }

      existingReq.onsuccess = () => {
        const existingItems = (existingReq.result || []) as CatalogItem[];
        const customItems = existingItems.filter(it => it.isCustom);

        const mergedItems: CatalogItem[] = [];

        // 1. Processa itens vindos do Seed
        for (const seedItem of seedItems) {
          const userOverride = overridesMap.get(seedItem.id);
          if (userOverride) {
            // Aplica os overrides do usuário sobre o seed
            const merged: CatalogItem = {
              ...seedItem,
              boxNumber: userOverride.boxNumber ?? seedItem.boxNumber,
              internalCode: userOverride.internalCode !== undefined ? userOverride.internalCode : seedItem.internalCode,
              commercialCodeRaw: userOverride.commercialCodeRaw ?? seedItem.commercialCodeRaw,
              crossReferenceCodes: userOverride.crossReferenceCodes ?? seedItem.crossReferenceCodes,
              oemCodes: userOverride.oemCodes ?? seedItem.oemCodes,
              price: userOverride.price !== undefined ? userOverride.price : seedItem.price,
              notes: userOverride.notes ?? seedItem.notes,
              additionalImages: userOverride.additionalImages ?? seedItem.additionalImages,
              primaryImage: userOverride.primaryImage ?? seedItem.primaryImage,
              descriptionRaw: userOverride.descriptionRaw ?? seedItem.descriptionRaw,
              title: userOverride.title ?? seedItem.title,
              updatedAt: userOverride.updatedAt,
            };
            itemsStore.put(merged);
            mergedItems.push(merged);
          } else {
            itemsStore.put(seedItem);
            mergedItems.push(seedItem);
          }
        }

        // 2. Preserva produtos cadastrados manualmente na loja (isCustom)
        for (const customItem of customItems) {
          itemsStore.put(customItem);
          mergedItems.push(customItem);
        }

        tx.oncomplete = () => {
          resolve(mergedItems);
        };
      };
    };

    tx.onerror = () => {
      reject(new Error(`Erro na sincronização do seed: ${tx.error?.message}`));
    };
  });
}

/**
 * Backup Completo com Checksum SHA-256
 */
export async function exportBackup(): Promise<{ payload: string; sha256: string; totalItems: number }> {
  const items = await getAllItems();
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    totalItems: items.length,
    items,
  };
  const payload = JSON.stringify(exportData, null, 2);
  const sha256 = await computeSHA256(payload);

  return { payload, sha256, totalItems: items.length };
}

/**
 * Restauração de Backup com Validação SHA-256
 */
export async function importBackup(
  jsonString: string,
  expectedSha256?: string
): Promise<{ success: boolean; importedCount: number; message: string }> {
  if (expectedSha256) {
    const computed = await computeSHA256(jsonString);
    if (computed !== expectedSha256.toUpperCase()) {
      return {
        success: false,
        importedCount: 0,
        message: `Falha de integridade: SHA-256 diverge (${computed} != ${expectedSha256})`,
      };
    }
  }

  let parsed: { items?: CatalogItem[] };
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return {
      success: false,
      importedCount: 0,
      message: `JSON inválido: ${(err as Error).message}`,
    };
  }

  if (!parsed.items || !Array.isArray(parsed.items)) {
    return {
      success: false,
      importedCount: 0,
      message: 'Formato de backup inválido: chave "items" ausente.',
    };
  }

  const db = await openDatabase();
  return new Promise((resolve) => {
    const tx = db.transaction([STORE_ITEMS, STORE_OVERRIDES], 'readwrite');
    const itemsStore = tx.objectStore(STORE_ITEMS);

    for (const item of parsed.items!) {
      if (item && item.id) {
        itemsStore.put(item);
      }
    }

    tx.oncomplete = () => {
      resolve({
        success: true,
        importedCount: parsed.items!.length,
        message: `${parsed.items!.length} itens importados com sucesso.`,
      });
    };

    tx.onerror = () => {
      resolve({
        success: false,
        importedCount: 0,
        message: `Erro ao gravar dados no IndexedDB: ${tx.error?.message}`,
      });
    };
  });
}

