export interface FloorData {
  id: string;
  name: string;
  area: number;
}

export interface CalculatorState {
  // Areas
  floors: FloorData[];
  mezzanine: { area: number; coef: number };
  balcony: { area: number; coef: number };
  terraceIn: { area: number; coef: number };
  terraceOut: { area: number; coef: number };
  roof: { area: number; coef: number };
  garden: { area: number };
  basement: { area: number; depth: number; coef: number };

  // Foundation & Pile
  pile: {
    concrete: { length: number; price: number };
    bored: { length: number; price: number };
    bamboo: { quantity: number; price: number };
  };
  fenceFront: { length: number; price: number };
  fenceRear: { length: number; price: number };
  foundationCap: { coef: number };
  foundationType: number; // For selection state only
  roofType: number; // For selection state only

  // Prices
  priceRough: number;
  priceFinish: number;
  pricePackage: number;
  priceInteriorFinish: number;
  priceGarden: number;

  // Services
  percentSupervision: number;
  percentAsbuilt: number;
  percentContingency: number;
  costPermit: number;

  // Design Fees (V5)
  priceDesignArch: number;
  areaInteriorFinish: number;
  areaDesignInterior: number;
  priceDesignInterior: number;
  areaDesignLandscape: number;
  priceDesignLandscape: number;
}

export interface CalculationResult {
  details: Array<{ name: string; pct: number; area: number }>;
  totalConstructionArea: number;
  areaInteriorFinish: number;
  
  // Costs Breakdown
  costRough: number;
  costFinish: number;
  costInteriorFinish: number;
  costConstruction: number; // Sum of rough + finish
  costPile: number;
  costGarden: number;
  costFenceFront: number;
  costFenceRear: number;
  costFence: number; // Total fence cost
  
  hardCost: number; // Construction + Pile + Garden + Fence
  
  // Services
  costDesignArch: number;
  designArchRatio: number; // % of construction cost
  costDesignInterior: number;
  designInteriorRatio: number;
  costDesignLandscape: number;
  designLandscapeRatio: number;
  totalDesignCost: number;

  costSupervision: number;
  costAsbuilt: number;
  costPermit: number;
  costContingency: number;
  
  grandTotal: number;
  
  // Meta
  usePackagePrice: boolean;
}