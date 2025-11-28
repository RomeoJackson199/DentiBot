// Shared constants for the application

// Supply SKU display names used to map to inventory item names
export const SKU_DISPLAY_NAME: Record<string, string> = {
  gloves: 'Gloves',
  mask: 'Mask',
  prophy_paste: 'Prophy Paste',
  disposable_cup: 'Disposable cup',
  anesthesia_cartridge: 'Anesthesia Cartridge',
  composite: 'Composite Syringe',
  bonding_agent: 'Bonding Agent',
  gauze: 'Gauze Pad',
  scalpel: 'Scalpel',
  sutures: 'Sutures',
  files: 'Files',
  sealer: 'Sealer',
  bur: 'Bur',
  impression_material: 'Impression Material',
  implant_kit: 'Implant Kit',
  drill: 'Drill',
  xray_film: 'X-ray film',
  scaler_tip: 'Scaler tip',
  fluoride_gel: 'Fluoride gel',
  tray: 'Tray',
  cotton_pellets: 'Cotton Pellets',
  matrix_bands: 'Matrix Bands',
  wedges: 'Wedges',
  polishing_strips: 'Polishing strips',
  separator: 'Separator',
  crown: 'Crown',
  retraction_cord: 'Retraction cord',
  temporary_cement: 'Temporary cement',
  final_cement: 'Final cement',
  bite_block: 'Bite block',
  needle: 'Needle',
  syringe: 'Syringe',
  healing_abutment: 'Healing abutment',
  cover_screw: 'Cover screw',
  bone_graft: 'Bone graft',
  membrane: 'Membrane',
  tacks: 'Tacks',
  developer: 'Developer',
  fixer: 'Fixer',
  irrigation: 'Irrigation',
  polishing_cup: 'Polishing cup',
  air_abrasion_powder: 'Air abrasion powder'
};

// Procedure definitions with default prices and supplies
export interface ProcedureDef {
  key: string;
  name: string;
  defaultPrice: number;
  defaultDurationMin: number;
  defaultSupplies: Array<{ sku: string; qty: number }>;
  category: 'Preventive' | 'Restorative' | 'Endo' | 'Surgery' | 'Radiology' | 'Perio' | 'Prostho' | 'Ortho' | 'Custom';
}

export const PROCEDURE_DEFS: ProcedureDef[] = [
  {
    key: 'checkup',
    name: 'Check-up',
    defaultPrice: 30,
    defaultDurationMin: 15,
    defaultSupplies: [{ sku: 'gloves', qty: 1 }, { sku: 'mask', qty: 1 }],
    category: 'Preventive'
  },
  {
    key: 'cleaning',
    name: 'Prophylaxis (Cleaning)',
    defaultPrice: 120,
    defaultDurationMin: 45,
    defaultSupplies: [
      { sku: 'prophy_paste', qty: 1 },
      { sku: 'disposable_cup', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 },
      { sku: 'scaler_tip', qty: 1 },
      { sku: 'fluoride_gel', qty: 1 },
      { sku: 'tray', qty: 1 }
    ],
    category: 'Preventive'
  },
  {
    key: 'filling_1',
    name: 'Filling — 1 surface',
    defaultPrice: 80,
    defaultDurationMin: 30,
    defaultSupplies: [
      { sku: 'composite', qty: 1 },
      { sku: 'bonding_agent', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Restorative'
  },
  {
    key: 'filling_2',
    name: 'Filling — 2 surfaces',
    defaultPrice: 120,
    defaultDurationMin: 40,
    defaultSupplies: [
      { sku: 'composite', qty: 1 },
      { sku: 'bonding_agent', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Restorative'
  },
  {
    key: 'filling_3_plus',
    name: 'Filling — 3+ surfaces',
    defaultPrice: 150,
    defaultDurationMin: 50,
    defaultSupplies: [
      { sku: 'composite', qty: 2 },
      { sku: 'bonding_agent', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Restorative'
  },
  {
    key: 'root_canal_anterior',
    name: 'Root canal — anterior',
    defaultPrice: 200,
    defaultDurationMin: 60,
    defaultSupplies: [
      { sku: 'files', qty: 1 },
      { sku: 'sealer', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Endo'
  },
  {
    key: 'root_canal_molar',
    name: 'Root canal — molar',
    defaultPrice: 350,
    defaultDurationMin: 90,
    defaultSupplies: [
      { sku: 'files', qty: 2 },
      { sku: 'sealer', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 2 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Endo'
  },
  {
    key: 'extraction_simple',
    name: 'Extraction — simple',
    defaultPrice: 75,
    defaultDurationMin: 30,
    defaultSupplies: [
      { sku: 'forceps', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'gauze', qty: 2 }
    ],
    category: 'Surgery'
  },
  {
    key: 'extraction_surgical',
    name: 'Extraction — surgical',
    defaultPrice: 150,
    defaultDurationMin: 60,
    defaultSupplies: [
      { sku: 'scalpel', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 2 },
      { sku: 'sutures', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'gauze', qty: 4 }
    ],
    category: 'Surgery'
  },
  {
    key: 'implant_placement',
    name: 'Implant — placement',
    defaultPrice: 1000,
    defaultDurationMin: 120,
    defaultSupplies: [
      { sku: 'implant_kit', qty: 1 },
      { sku: 'drill', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'sutures', qty: 1 },
      { sku: 'mask', qty: 1 },
      { sku: 'gauze', qty: 4 }
    ],
    category: 'Surgery'
  },
  {
    key: 'bitewing_xray',
    name: 'Bitewing — 2 images',
    defaultPrice: 25,
    defaultDurationMin: 10,
    defaultSupplies: [
      { sku: 'xray_film', qty: 2 },
      { sku: 'gloves', qty: 1 }
    ],
    category: 'Radiology'
  },
  {
    key: 'periapical_xray',
    name: 'Periapical X-ray',
    defaultPrice: 20,
    defaultDurationMin: 8,
    defaultSupplies: [
      { sku: 'xray_film', qty: 1 },
      { sku: 'gloves', qty: 1 }
    ],
    category: 'Radiology'
  },
  {
    key: 'panoramic_xray',
    name: 'Panoramic X-ray',
    defaultPrice: 60,
    defaultDurationMin: 15,
    defaultSupplies: [
      { sku: 'xray_film', qty: 1 },
      { sku: 'gloves', qty: 1 }
    ],
    category: 'Radiology'
  },
  {
    key: 'scaling_quadrant',
    name: 'Scaling — per quadrant',
    defaultPrice: 90,
    defaultDurationMin: 45,
    defaultSupplies: [
      { sku: 'scaler_tip', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Perio'
  },
  {
    key: 'crown_prep',
    name: 'Crown prep',
    defaultPrice: 400,
    defaultDurationMin: 90,
    defaultSupplies: [
      { sku: 'bur', qty: 1 },
      { sku: 'impression_material', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Prostho'
  },
  {
    key: 'temp_crown',
    name: 'Temporary crown',
    defaultPrice: 120,
    defaultDurationMin: 30,
    defaultSupplies: [
      { sku: 'impression_material', qty: 1 },
      { sku: 'gloves', qty: 1 }
    ],
    category: 'Prostho'
  },
  {
    key: 'ortho_adjustment',
    name: 'Ortho — adjustment',
    defaultPrice: 100,
    defaultDurationMin: 30,
    defaultSupplies: [
      { sku: 'pliers', qty: 1 },
      { sku: 'elastic', qty: 1 },
      { sku: 'gloves', qty: 1 }
    ],
    category: 'Ortho'
  }
];

// Status colors for consistent theming
export const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  confirmed: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800'
} as const;

// Urgency colors for consistent theming
export const URGENCY_COLORS = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
} as const;