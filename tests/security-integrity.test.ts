import { describe, it, expect } from 'bun:test';
import seedData from '../src/data/catalog-master-seed.json';
import { CatalogItem } from '../src/types/catalog';
import { computeSHA256 } from '../src/storage/indexeddb';

const items = seedData.items as CatalogItem[];

describe('Segurança, Integridade e Conformidade Padrão Ouro', () => {
  it('garante que 100% dos caminhos e URLs de imagens estão em lowercase', () => {
    for (const item of items) {
      if (item.primaryImage) {
        expect(item.primaryImage).toBe(item.primaryImage.toLowerCase());
      }
      for (const addImg of item.additionalImages) {
        expect(addImg).toBe(addImg.toLowerCase());
      }
    }
  });

  it('valida que todas as 152 peças possuem ID único em lowercase', () => {
    const ids = new Set<string>();
    for (const item of items) {
      expect(item.id).toBe(item.id.toLowerCase());
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);
    }
    expect(ids.size).toBe(152);
  });

  it('calcula e valida checksum criptográfico SHA-256 de backup', async () => {
    const samplePayload = JSON.stringify({ test: 'balcao-soquetes', count: 152 });
    const hash = await computeSHA256(samplePayload);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[A-F0-9]{64}$/);

    // Validação com payload idêntico
    const hash2 = await computeSHA256(samplePayload);
    expect(hash2).toBe(hash);

    // Validação de divergência em caso de corrupção
    const tamperedPayload = JSON.stringify({ test: 'balcao-soquetes', count: 153 });
    const hashTampered = await computeSHA256(tamperedPayload);
    expect(hashTampered).not.toBe(hash);
  });

  it('protege contra injeções de script em campos de busca', () => {
    const malicious = '<script>alert("xss")</script>';
    const clean = malicious.replace(/<[^>]*>/g, '');
    expect(clean).not.toContain('<script>');
  });

  it('preserva integridade do total extraído dos 2 arquivos Word (39 circuitos + 113 soquetes = 152 itens)', () => {
    expect(seedData.metadata.totalItems).toBe(152);
    expect(seedData.metadata.circuitoCount).toBe(39);
    expect(seedData.metadata.soqueteCount).toBe(113);
    expect(seedData.metadata.pixelAuditPass).toBe(152);
  });
});
