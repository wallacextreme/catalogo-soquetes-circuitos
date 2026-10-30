// Omnibox Search Engine (< 50ms) Especializada em Balcão de Peças
// Tolerante a hífens, pontos, acentos, maiúsculas/minúsculas e busca combinada de termos.

import { CatalogItem, FilterState } from '../types/catalog';

export function normalizeSearchString(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .trim();
}

export function cleanCodeToken(text: string): string {
  return normalizeSearchString(text).replace(/[^a-z0-9]/g, '');
}

/**
 * Motor de Busca com ranking e latência < 50ms
 */
export function searchCatalog(
  items: CatalogItem[],
  filters: FilterState
): { results: CatalogItem[]; latencyMs: number } {
  const startTime = performance.now();

  const queryRaw = filters.searchQuery.trim();
  const queryNormalized = normalizeSearchString(queryRaw);
  const queryClean = cleanCodeToken(queryRaw);
  const queryTerms = queryNormalized.split(/\s+/).filter(t => t.length > 0);

  // Verifica se o usuário digitou uma busca direta por Caixa (ex.: "05", "cx 05", "cx05", "caixa 12")
  const boxMatch = queryRaw.match(/^(?:cx|caixa)?\s*([a-z0-9]+)$/i);
  const explicitBoxQuery = boxMatch ? boxMatch[1].toUpperCase() : null;

  const filtered = items.filter((item) => {
    // 1. Filtro Macro-Categoria (Abas Principais)
    if (filters.macroCategory !== 'all' && item.macroCategory !== filters.macroCategory) {
      return false;
    }

    // 2. Filtros de Placas de Circuito
    if (item.macroCategory === 'circuito' && item.circuitSpecs) {
      if (filters.circuitSide !== 'all') {
        const pos = item.circuitSpecs.position;
        if (filters.circuitSide === 'LD' && pos !== 'LD' && pos !== 'Central LD') return false;
        if (filters.circuitSide === 'LE' && pos !== 'LE' && pos !== 'Central LE') return false;
        if (filters.circuitSide === 'LD/LE (Ambos)' && !pos.includes('Ambos') && !pos.includes('LD/LE')) return false;
      }

      if (filters.circuitSystem !== 'all') {
        if (item.circuitSpecs.lanternSystem !== filters.circuitSystem) return false;
      }
    }

    // 3. Filtros de Soquetes
    if (item.macroCategory === 'soquete' && item.socketSpecs) {
      if (filters.socketPoles !== 'all') {
        if (item.socketSpecs.poles !== filters.socketPoles) return false;
      }

      if (filters.socketLamp !== 'all') {
        const lamp = item.socketSpecs.lampType || '';
        const mat = item.socketSpecs.material || '';
        const pin = item.socketSpecs.pinType || '';

        if (filters.socketLamp === 'Porcelana') {
          if (!mat.toLowerCase().includes('porcelana') && !mat.toLowerCase().includes('ceramica')) return false;
        } else if (filters.socketLamp === 'Pino Desencontrado') {
          if (!pin.toLowerCase().includes('desencontrado') && !pin.toLowerCase().includes('doido')) return false;
        } else {
          if (!lamp.toLowerCase().includes(filters.socketLamp.toLowerCase())) return false;
        }
      }
    }

    // 4. Filtro por Montadora
    if (filters.make && filters.make !== 'all') {
      const itemMake = item.circuitSpecs?.make || item.socketSpecs?.make || '';
      if (itemMake.toLowerCase() !== filters.make.toLowerCase()) {
        return false;
      }
    }

    // 5. Filtro de Status de Foto
    if (filters.hasPhoto === 'withPhoto' && !item.primaryImage) return false;
    if (filters.hasPhoto === 'noPhoto' && item.primaryImage) return false;
    if (filters.hasPhoto === 'multiPhoto' && (!item.additionalImages || item.additionalImages.length === 0)) return false;

    // 6. Omnibox Busca Textual
    if (queryTerms.length === 0) return true;

    // A) Match exato de Caixa (prioridade máxima de balcão)
    if (explicitBoxQuery) {
      const itemBoxClean = item.boxNumber.toUpperCase();
      if (itemBoxClean === explicitBoxQuery) return true;
      if (parseInt(itemBoxClean, 10) === parseInt(explicitBoxQuery, 10)) return true;
    }

    // B) Match exato ou parcial por código comercial / OEM / interno
    const codeClean = cleanCodeToken(item.commercialCodeRaw);
    if (queryClean.length >= 3 && codeClean.includes(queryClean)) {
      return true;
    }

    for (const cross of item.crossReferenceCodes) {
      if (queryClean.length >= 3 && cleanCodeToken(cross).includes(queryClean)) {
        return true;
      }
    }

    for (const oem of item.oemCodes) {
      if (cleanCodeToken(oem).includes(queryClean)) {
        return true;
      }
    }

    if (item.internalCode && cleanCodeToken(item.internalCode).includes(queryClean)) {
      return true;
    }

    // C) Busca multi-termo interseccional (AND) sobre texto e tokens
    const searchableCorpus = normalizeSearchString(
      `${item.boxNumber} ${item.commercialCodeRaw} ${item.title} ${item.descriptionRaw} ${item.crossReferenceCodes.join(' ')} ${item.oemCodes.join(' ')} ${item.internalCode || ''} ${item.category} ${item.subCategory} ${item.circuitSpecs?.position || ''} ${item.circuitSpecs?.make || ''} ${item.circuitSpecs?.years || ''} ${item.socketSpecs?.lampType || ''} ${item.socketSpecs?.pinType || ''} ${item.socketSpecs?.material || ''}`
    );

    return queryTerms.every((term) => {
      // Se termo é "cx05" ou "cx12"
      const tClean = cleanCodeToken(term);
      if (searchableCorpus.includes(term) || searchableCorpus.includes(tClean)) {
        return true;
      }
      return item.searchTokens.some((tok) => normalizeSearchString(tok).includes(term) || cleanCodeToken(tok).includes(tClean));
    });
  });

  // Ordenação inteligente:
  // Se usuário buscou por caixa ou termo específico, os mais relevantes vêm primeiro.
  filtered.sort((a, b) => {
    if (explicitBoxQuery) {
      const aMatch = a.boxNumber.toUpperCase() === explicitBoxQuery;
      const bMatch = b.boxNumber.toUpperCase() === explicitBoxQuery;
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }

    // Ordenação padrão: número da caixa crescente
    const aNum = parseInt(a.boxNumber, 10);
    const bNum = parseInt(b.boxNumber, 10);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    return a.boxNumber.localeCompare(b.boxNumber);
  });

  const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;
  return { results: filtered, latencyMs };
}
