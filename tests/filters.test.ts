import { describe, it, expect } from 'bun:test';
import seedData from '../src/data/catalog-master-seed.json';
import { CatalogItem, FilterState } from '../src/types/catalog';
import { searchCatalog } from '../src/search/omnibox-engine';

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

describe('Filtros Especializados de Balcão (LD/LE, Polos, Farol, Montadora)', () => {
  it('filtra por Macro-Categoria (Placas de Circuito vs Soquetes Diversos)', () => {
    const circuitos = searchCatalog(items, { ...defaultFilters, macroCategory: 'circuito' });
    expect(circuitos.results.length).toBe(39);
    expect(circuitos.results.every(it => it.macroCategory === 'circuito')).toBe(true);

    const soquetes = searchCatalog(items, { ...defaultFilters, macroCategory: 'soquete' });
    expect(soquetes.results.length).toBe(113);
    expect(soquetes.results.every(it => it.macroCategory === 'soquete')).toBe(true);
  });

  it('filtra Placas de Circuito por Lado (LD vs LE)', () => {
    const ldResults = searchCatalog(items, { ...defaultFilters, macroCategory: 'circuito', circuitSide: 'LD' });
    expect(ldResults.results.length).toBeGreaterThan(0);
    expect(ldResults.results.every(it => it.circuitSpecs?.position === 'LD' || it.circuitSpecs?.position === 'Central LD')).toBe(true);

    const leResults = searchCatalog(items, { ...defaultFilters, macroCategory: 'circuito', circuitSide: 'LE' });
    expect(leResults.results.length).toBeGreaterThan(0);
    expect(leResults.results.every(it => it.circuitSpecs?.position === 'LE' || it.circuitSpecs?.position === 'Central LE')).toBe(true);
  });

  it('filtra Soquetes por Polos (1 Polo vs 2 Polos)', () => {
    const p1 = searchCatalog(items, { ...defaultFilters, macroCategory: 'soquete', socketPoles: 1 });
    expect(p1.results.length).toBeGreaterThan(0);
    expect(p1.results.every(it => it.socketSpecs?.poles === 1)).toBe(true);

    const p2 = searchCatalog(items, { ...defaultFilters, macroCategory: 'soquete', socketPoles: 2 });
    expect(p2.results.length).toBeGreaterThan(0);
    expect(p2.results.every(it => it.socketSpecs?.poles === 2)).toBe(true);
  });

  it('filtra Soquetes por tipo de lâmpada e base (H7, H4, T10)', () => {
    const h7 = searchCatalog(items, { ...defaultFilters, macroCategory: 'soquete', socketLamp: 'H7' });
    expect(h7.results.length).toBeGreaterThan(0);
    expect(h7.results.some(it => it.commercialCodeRaw.includes('7491'))).toBe(true);

    const h4 = searchCatalog(items, { ...defaultFilters, macroCategory: 'soquete', socketLamp: 'H4' });
    expect(h4.results.length).toBeGreaterThan(0);
    expect(h4.results.some(it => it.commercialCodeRaw.includes('2001'))).toBe(true);

    const t10 = searchCatalog(items, { ...defaultFilters, macroCategory: 'soquete', socketLamp: 'T10' });
    expect(t10.results.length).toBeGreaterThan(0);
  });

  it('filtra por Montadora (VW, Fiat, GM, Ford)', () => {
    const vw = searchCatalog(items, { ...defaultFilters, make: 'VW' });
    expect(vw.results.length).toBeGreaterThan(0);

    const gm = searchCatalog(items, { ...defaultFilters, make: 'GM' });
    expect(gm.results.length).toBeGreaterThan(0);

    const fiat = searchCatalog(items, { ...defaultFilters, make: 'Fiat' });
    expect(fiat.results.length).toBeGreaterThan(0);
  });

  it('filtra por Subcategoria (Farol e Milha, Lanterna e Pisca, Painel e Instrumentos)', () => {
    const farol = searchCatalog(items, { ...defaultFilters, subCategory: 'Farol e Milha' });
    expect(farol.results.length).toBe(9);
    expect(farol.results.every(it => it.subCategory === 'Farol e Milha')).toBe(true);

    const pisca = searchCatalog(items, { ...defaultFilters, subCategory: 'Lanterna e Pisca' });
    expect(pisca.results.length).toBe(24);
    expect(pisca.results.every(it => it.subCategory === 'Lanterna e Pisca')).toBe(true);

    const painel = searchCatalog(items, { ...defaultFilters, subCategory: 'Painel e Instrumentos' });
    expect(painel.results.length).toBe(17);
    expect(painel.results.every(it => it.subCategory === 'Painel e Instrumentos')).toBe(true);
  });
});

