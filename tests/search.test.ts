import { describe, it, expect } from 'bun:test';
import seedData from '../src/data/catalog-master-seed.json';
import { CatalogItem, FilterState } from '../src/types/catalog';
import { searchCatalog, normalizeSearchString, cleanCodeToken } from '../src/search/omnibox-engine';

const items = seedData.items as CatalogItem[];

const defaultFilters: FilterState = {
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

describe('Omnibox Engine (< 50ms) - Balcão de Peças', () => {
  it('localiza peças instantaneamente pelo número da caixa (01, cx 01, caixa 73)', () => {
    // Busca por caixa "01"
    const r1 = searchCatalog(items, { ...defaultFilters, searchQuery: '01' });
    expect(r1.results.length).toBeGreaterThan(0);
    expect(r1.results.some(it => it.boxNumber === '01')).toBe(true);

    // Busca por "cx 73"
    const r2 = searchCatalog(items, { ...defaultFilters, searchQuery: 'cx 73' });
    expect(r2.results.length).toBeGreaterThan(0);
    expect(r2.results.some(it => it.boxNumber === '73')).toBe(true);
    expect(r2.results.some(it => it.commercialCodeRaw.includes('7491'))).toBe(true);

    // Busca por "caixa 25"
    const r3 = searchCatalog(items, { ...defaultFilters, searchQuery: 'caixa 25' });
    expect(r3.results.length).toBeGreaterThan(0);
    expect(r3.results.some(it => it.boxNumber === '25')).toBe(true);
  });

  it('localiza pelo código principal do fabricante (com ou sem hífen)', () => {
    // ETE-7491 vs ETE7491
    const r1 = searchCatalog(items, { ...defaultFilters, searchQuery: 'ETE-7491' });
    const r2 = searchCatalog(items, { ...defaultFilters, searchQuery: 'ete7491' });
    expect(r1.results.length).toBeGreaterThan(0);
    expect(r2.results.length).toBeGreaterThan(0);
    expect(r1.results[0].id).toBe(r2.results[0].id);

    // DP2001
    const r3 = searchCatalog(items, { ...defaultFilters, searchQuery: 'DP2001' });
    expect(r3.results.length).toBeGreaterThan(0);
    expect(r3.results.some(it => it.boxNumber === '50')).toBe(true);

    // DEP2272 (Placa Celta)
    const r4 = searchCatalog(items, { ...defaultFilters, searchQuery: 'DEP2272' });
    expect(r4.results.length).toBeGreaterThan(0);
  });

  it('localiza por código cruzado (conversão na mesma célula)', () => {
    // DP2006 / ETE7900 -> buscando por ETE7900 deve achar o produto
    const r = searchCatalog(items, { ...defaultFilters, searchQuery: 'ETE7900' });
    expect(r.results.length).toBeGreaterThan(0);
    expect(r.results.some(it => it.boxNumber === '07')).toBe(true);

    // DP7253 / ETE7490 -> buscando por ETE7490 deve achar o produto
    const r2 = searchCatalog(items, { ...defaultFilters, searchQuery: 'ETE7490' });
    expect(r2.results.length).toBeGreaterThan(0);
    expect(r2.results.some(it => it.boxNumber === '04')).toBe(true);
  });

  it('localiza por código original OEM', () => {
    // 90.047.485 (Chevette/Opala/Monza na caixa 26)
    const r = searchCatalog(items, { ...defaultFilters, searchQuery: '90.047.485' });
    expect(r.results.length).toBeGreaterThan(0);
    expect(r.results.some(it => it.boxNumber === '26')).toBe(true);
  });

  it('realiza busca combinada de balcão (carro + lado + sistema)', () => {
    // "gol bola"
    const r1 = searchCatalog(items, { ...defaultFilters, searchQuery: 'gol bola' });
    expect(r1.results.length).toBeGreaterThan(0);
    expect(r1.results.some(it => it.boxNumber === '01')).toBe(true);

    // "celta direita"
    const r2 = searchCatalog(items, { ...defaultFilters, searchQuery: 'celta direita' });
    expect(r2.results.length).toBeGreaterThan(0);

    // "uno cibie"
    const r3 = searchCatalog(items, { ...defaultFilters, searchQuery: 'uno cibie' });
    expect(r3.results.length).toBeGreaterThan(0);
  });

  it('cumpre o requisito estrito de latência < 50ms', () => {
    const queries = ['01', '73', 'ete', 'celta', 'h7', 'palio', 'cibie', 'arteb', '1polo', 'porcelana'];
    for (const q of queries) {
      const { latencyMs } = searchCatalog(items, { ...defaultFilters, searchQuery: q });
      expect(latencyMs).toBeLessThan(50);
    }
  });

  it('normaliza strings e tokens de forma tolerante a acentos e caracteres especiais', () => {
    expect(normalizeSearchString('LÂMPADA')).toBe('lampada');
    expect(normalizeSearchString('Cibié')).toBe('cibie');
    expect(cleanCodeToken('ETE-7491')).toBe('ete7491');
    expect(cleanCodeToken('DP.3111')).toBe('dp3111');
  });
});

