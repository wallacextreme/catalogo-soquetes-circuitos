// Tipagem Estrita TypeScript (strict: true, zero any)
// Catálogo Interno de Balcão - Placas de Circuito e Soquetes Diversos

export type MacroCategory = 'circuito' | 'soquete';

export type CircuitPosition = 'LD' | 'LE' | 'LD/LE (Ambos)' | 'Central' | 'Central LD' | 'Central LE';

export interface CircuitSpecs {
  position: CircuitPosition | string;
  positionBadge: string;
  lanternSystem: 'Arteb' | 'Cibié' | 'VDO' | 'Marelli' | string | null;
  make: 'VW' | 'Fiat' | 'GM' | 'Ford' | 'Honda' | 'Toyota' | 'Outros' | string;
  years: string | null;
}

export interface SocketSpecs {
  lampType: string | null;
  poles: number | null;
  pinType: string | null;
  wires: string | null;
  material: string | null;
  baseStyle: string | null;
  make: string;
}

export interface CatalogItem {
  id: string;
  boxNumber: string;
  internalCode: string | null;
  commercialCodeRaw: string;
  normalizedCode: string;
  crossReferenceCodes: string[];
  oemCodes: string[];
  title: string;
  descriptionRaw: string;
  category: string;
  macroCategory: MacroCategory;
  subCategory: string;
  circuitSpecs: CircuitSpecs | null;
  socketSpecs: SocketSpecs | null;
  primaryImage: string;
  additionalImages: string[];
  sourceDocument: string;
  rowIndex: number;
  slot: 'left' | 'right';
  needsDescriptionReview: boolean;
  searchTokens: string[];
  price: number | null;
  notes: string;
  updatedAt?: string;
  isCustom?: boolean;
}

export interface MasterSeedPayload {
  metadata: {
    version: string;
    extractedAt: string;
    totalItems: number;
    circuitoCount: number;
    soqueteCount: number;
    totalImages: number;
    pixelAuditPass: number;
    sourceDocuments: Array<{
      fileName: string;
      description: string;
      itemCount: number;
    }>;
  };
  items: CatalogItem[];
}

export type ViewMode = 'grid' | 'mural' | 'boxmap';

export interface FilterState {
  searchQuery: string;
  macroCategory: 'all' | 'circuito' | 'soquete';
  circuitSide: 'all' | 'LD' | 'LE' | 'LD/LE (Ambos)';
  circuitSystem: 'all' | 'Arteb' | 'Cibié';
  socketPoles: 'all' | 1 | 2;
  socketLamp: 'all' | 'H1' | 'H4' | 'H7' | 'T10' | 'T5' | '69' | '75' | 'Porcelana' | 'Pino Desencontrado';
  make: string;
  hasPhoto: 'all' | 'withPhoto' | 'multiPhoto' | 'noPhoto';
  viewMode: ViewMode;
  hidePrices: boolean;
}

export interface BoxSummary {
  boxNumber: string;
  count: number;
  items: CatalogItem[];
  macroCategories: Set<MacroCategory>;
}
