/* eslint-disable max-lines, no-console -- CLI seed generator progress output */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function mulberry32(a: number): () => number {
  return function (): number {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const prngSeed = 123456789;
const random = mulberry32(prngSeed);
const randomMove = mulberry32(prngSeed + 1);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pickMove<T>(arr: T[]): T {
  return arr[Math.floor(randomMove() * arr.length)];
}

function randIntMove(min: number, max: number): number {
  return Math.floor(randomMove() * (max - min + 1)) + min;
}

// Types
interface Store {
  id: string;
  name: string;
}

interface Category {
  name: string;
}

interface Supplier {
  name: string;
}

interface User {
  id: string;
  name: string;
  initials: string;
  role: "manager" | "staff";
}

interface Product {
  sku: string;
  name: string;
  category: string;
  supplier: string;
  unitCostSen: number;
}

interface StockRow {
  storeId: string;
  onHand: number;
  reorderLevel: number;
}

interface Movement {
  productId: string;
  storeId: string;
  type: "receive" | "sell" | "write_off" | "transfer_out" | "transfer_in";
  quantity: number;
  balanceAfter: number;
  reason: string | null;
  transferId: string | null;
  createdAt: string;
  userId: string;
}

// Data from SCREENS.md
const stores: Store[] = [
  { id: "mont-kiara", name: "Mont Kiara" },
  { id: "subang", name: "Subang" },
  { id: "damansara", name: "Damansara" },
  { id: "cheras", name: "Cheras" },
  { id: "puchong", name: "Puchong" },
  { id: "shah-alam", name: "Shah Alam" },
];

const categories: Category[] = [
  { name: "Coffee" },
  { name: "Dairy & alt." },
  { name: "Packaging" },
  { name: "Syrups" },
  { name: "Bakery" },
  { name: "Tea" },
];

const suppliers: Supplier[] = [
  { name: "Highland Roasters" },
  { name: "Kopi Lane roastery" },
  { name: "Green Field Oats" },
  { name: "Valley Dairy" },
  { name: "PackRight" },
  { name: "Sweet Bar Co." },
  { name: "Golden Crumb Bakery" },
];

const users: User[] = [
  { id: "aina-rahman", name: "Aina Rahman", initials: "AR", role: "manager" },
  { id: "faiz-hakim", name: "Faiz Hakim", initials: "FH", role: "staff" },
  { id: "mei-ling", name: "Mei Ling", initials: "ML", role: "staff" },
];

const PRODUCT_NAMES: Record<string, string[]> = {
  coffee: [
    "Arabica beans 1 kg",
    "Robusta beans 1 kg",
    "Espresso blend 500g",
    "Decaf beans 1 kg",
    "Single origin Colombia 500g",
    "Ethiopian Yirgacheffe 500g",
    "House blend 1 kg",
    "Cold brew concentrate 1L",
  ],
  dairy: [
    "Oat milk 1 L",
    "Almond milk 1 L",
    "Whole milk 1 L",
    "Soy milk 1 L",
    "Coconut milk 500ml",
    "Condensed milk 397g",
  ],
  packaging: [
    "Paper cups 8oz 1000pcs",
    "Paper cups 12oz 1000pcs",
    "Lids 8oz 1000pcs",
    "Lids 12oz 1000pcs",
    "Paper straws 1000pcs",
    "Cup sleeves 500pcs",
  ],
  syrup: [
    "Vanilla syrup 750ml",
    "Caramel syrup 750ml",
    "Hazelnut syrup 750ml",
    "Chocolate syrup 750ml",
    "Mint syrup 750ml",
    "Cinnamon syrup 750ml",
  ],
  bakery: [
    "Croissants 12pcs",
    "Chocolate croissants 12pcs",
    "Almond croissants 12pcs",
    "Blueberry muffins 12pcs",
    "Chocolate chip cookies 24pcs",
    "Banana bread 1 loaf",
  ],
  tea: [
    "Earl Grey tea 100 bags",
    "English Breakfast tea 100 bags",
    "Green tea 100 bags",
    "Chamomile tea 100 bags",
    "Peppermint tea 100 bags",
    "Jasmine tea 100 bags",
  ],
};

const TIME_ZONE = "Asia/Kuala_Lumpur";

const CATEGORY_CONFIG: Record<string, { bases: string[]; sizes: string[]; suppliers: string[] }> = {
  Coffee: {
    bases: [
      "Arabica beans",
      "Robusta beans",
      "Espresso blend",
      "Decaf beans",
      "Single origin Colombia",
      "Ethiopian Yirgacheffe",
      "House blend",
      "Cold brew concentrate",
      "Sumatra Mandheling",
      "Guatemala Antigua",
    ],
    sizes: [
      "200g",
      "250g",
      "350g",
      "500g",
      "1 kg",
      "2 kg",
      "beans 250g",
      "beans 500g",
      "ground 250g",
      "ground 500g",
      "drip bags 10pcs",
    ],
    suppliers: ["Highland Roasters", "Kopi Lane roastery"],
  },
  "Dairy & alt.": {
    bases: [
      "Oat milk",
      "Almond milk",
      "Whole milk",
      "Soy milk",
      "Coconut milk",
      "Condensed milk",
      "Low fat milk",
      "Skim milk",
      "Cashew milk",
    ],
    sizes: [
      "200ml",
      "250ml",
      "330ml",
      "500ml",
      "1 L",
      "2 L",
      "organic 1 L",
      "barista edition 1 L",
      "unsweetened 1 L",
      "can 397g",
    ],
    suppliers: ["Valley Dairy", "Green Field Oats"],
  },
  Packaging: {
    bases: [
      "Paper cups 8oz",
      "Paper cups 12oz",
      "Paper cups 16oz",
      "Lids 8oz",
      "Lids 12oz",
      "Lids 16oz",
      "Paper straws",
      "Cup sleeves",
      "Takeaway bags",
      "Cup carriers",
    ],
    sizes: [
      "50pcs",
      "100pcs",
      "200pcs",
      "250pcs",
      "500pcs",
      "1000pcs",
      "kraft 500pcs",
      "white 500pcs",
      "black 500pcs",
      "biodegradable 500pcs",
    ],
    suppliers: ["PackRight"],
  },
  Syrups: {
    bases: [
      "Vanilla syrup",
      "Caramel syrup",
      "Hazelnut syrup",
      "Chocolate syrup",
      "Mint syrup",
      "Cinnamon syrup",
      "Toffee nut syrup",
      "Salted caramel syrup",
      "Lavender syrup",
    ],
    sizes: [
      "250ml",
      "375ml",
      "500ml",
      "750ml",
      "1 L",
      "sugar-free 750ml",
      "organic 750ml",
      "classic 750ml",
    ],
    suppliers: ["Sweet Bar Co."],
  },
  Bakery: {
    bases: [
      "Croissants",
      "Chocolate croissants",
      "Almond croissants",
      "Blueberry muffins",
      "Chocolate chip cookies",
      "Banana bread",
      "Cinnamon rolls",
      "Sourdough loaf",
      "Bagels",
    ],
    sizes: [
      "2pcs",
      "4pcs",
      "6pcs",
      "12pcs",
      "24pcs",
      "1 loaf",
      "mini 12pcs",
      "large 6pcs",
      "fresh baked 6pcs",
    ],
    suppliers: ["Golden Crumb Bakery"],
  },
  Tea: {
    bases: [
      "Earl Grey tea",
      "English Breakfast tea",
      "Green tea",
      "Chamomile tea",
      "Peppermint tea",
      "Jasmine tea",
      "Oolong tea",
      "Chai tea",
      "Matcha powder",
    ],
    sizes: [
      "20 bags",
      "25 bags",
      "50 bags",
      "100 bags",
      "loose leaf 100g",
      "loose leaf 250g",
      "tin 100g",
      "organic 50 bags",
    ],
    suppliers: ["Highland Roasters", "Kopi Lane roastery"],
  },
};

function makeProductsUnique(products: Product[]): Product[] {
  const usedNames = new Set<string>();
  const categoryPools: Record<string, string[]> = {};
  const supplierCounters: Record<string, number> = {};

  for (const [cat, cfg] of Object.entries(CATEGORY_CONFIG)) {
    const pool: string[] = [];
    for (const size of cfg.sizes) {
      for (const base of cfg.bases) {
        const candidate = base.endsWith(size) ? base : `${base} ${size}`;
        if (!pool.includes(candidate)) {
          pool.push(candidate);
        }
      }
    }
    categoryPools[cat] = pool;
    supplierCounters[cat] = 0;
  }

  // Preserve fixtures so their names are reserved
  usedNames.add("Arabica beans 1 kg");
  usedNames.add("Robusta beans 1 kg");
  usedNames.add("Oat milk 1 L");

  return products.map((p) => {
    if (p.sku === "KL-1042") {
      return {
        ...p,
        name: "Arabica beans 1 kg",
        category: "Coffee",
        supplier: "Highland Roasters",
        unitCostSen: 6800,
      };
    }
    if (p.sku === "KL-1043") {
      return {
        ...p,
        name: "Robusta beans 1 kg",
        category: "Coffee",
        supplier: "Highland Roasters",
        unitCostSen: 5500,
      };
    }
    if (p.sku === "KL-2210") {
      return {
        ...p,
        name: "Oat milk 1 L",
        category: "Dairy & alt.",
        supplier: "Green Field Oats",
        unitCostSen: 1200,
      };
    }

    const cfg = CATEGORY_CONFIG[p.category];
    const pool = categoryPools[p.category] || [];

    let newName = p.name;
    for (const candidate of pool) {
      if (!usedNames.has(candidate)) {
        newName = candidate;
        break;
      }
    }
    usedNames.add(newName);

    const supList = cfg ? cfg.suppliers : ["Highland Roasters"];
    const supIndex = supplierCounters[p.category] ?? 0;
    supplierCounters[p.category] = supIndex + 1;
    const supplier = supList[supIndex % supList.length];

    return {
      ...p,
      name: newName,
      supplier,
    };
  });
}


const PRODUCT_FIXTURES: Product[] = [
  {
    sku: "KL-1042",
    name: "Arabica beans 1 kg",
    category: "Coffee",
    supplier: "Highland Roasters",
    unitCostSen: 6800,
  },
  {
    sku: "KL-1043",
    name: "Robusta beans 1 kg",
    category: "Coffee",
    supplier: "Highland Roasters",
    unitCostSen: 5500,
  },
  {
    sku: "KL-2210",
    name: "Oat milk 1 L",
    category: "Dairy & alt.",
    supplier: "Green Field Oats",
    unitCostSen: 1200,
  },
];

function generateProducts(): Product[] {
  const products: Product[] = [];
  products.push(...PRODUCT_FIXTURES);

  const categoryNames: Record<string, string[]> = {
    Coffee: PRODUCT_NAMES.coffee,
    "Dairy & alt.": PRODUCT_NAMES.dairy,
    Packaging: PRODUCT_NAMES.packaging,
    Syrups: PRODUCT_NAMES.syrup,
    Bakery: PRODUCT_NAMES.bakery,
    Tea: PRODUCT_NAMES.tea,
  };

  let skuCounter = 1000;
  const targetProducts = 243;
  const reservedSkus = new Set(["KL-1042", "KL-1043", "KL-2210"]);

  while (products.length < 3 + targetProducts) {
    const sku = `KL-${skuCounter++}`;
    if (reservedSkus.has(sku)) {
      continue;
    }
    const category = pick(categories);
    const names = categoryNames[category.name];
    const nameBase = pick(names);

    products.push({
      sku,
      name: nameBase,
      category: category.name,
      supplier: pick(suppliers).name,
      unitCostSen: randInt(500, 15000),
    });
  }

  products.push({
    sku: `KL-${skuCounter++}`,
    name: "Premium Italian dark roast coffee beans from single origin plantation 1kg",
    category: "Coffee",
    supplier: "Highland Roasters",
    unitCostSen: 12000,
  });

  products.push({
    sku: `KL-${skuCounter++}`,
    name: "Organic grass-fed whole milk from local farm with no added preservatives 1L",
    category: "Dairy & alt.",
    supplier: "Valley Dairy",
    unitCostSen: 2500,
  });

  return products;
}

const FIXTURE_STOCK: Record<string, StockRow[]> = {
  "KL-1042": [
    { storeId: "mont-kiara", onHand: 18, reorderLevel: 5 },
    { storeId: "subang", onHand: 4, reorderLevel: 5 },
    { storeId: "cheras", onHand: 0, reorderLevel: 5 },
    { storeId: "damansara", onHand: 22, reorderLevel: 5 },
    { storeId: "puchong", onHand: 15, reorderLevel: 5 },
    { storeId: "shah-alam", onHand: 25, reorderLevel: 5 },
  ],
  "KL-1043": [
    { storeId: "mont-kiara", onHand: 25, reorderLevel: 10 },
    { storeId: "subang", onHand: 15, reorderLevel: 10 },
    { storeId: "damansara", onHand: 20, reorderLevel: 10 },
    { storeId: "puchong", onHand: 10, reorderLevel: 10 },
  ],
  "KL-2210": [
    { storeId: "mont-kiara", onHand: 0, reorderLevel: 5 },
    { storeId: "subang", onHand: 0, reorderLevel: 5 },
    { storeId: "damansara", onHand: 0, reorderLevel: 5 },
    { storeId: "puchong", onHand: 0, reorderLevel: 5 },
  ],
};

function generateStockRows(
  products: Product[],
  productFixtures: Product[],
): Map<string, StockRow[]> {
  const stockRows: Map<string, StockRow[]> = new Map();
  let montKiaraCount = 3;
  const otherProducts = products.filter((p) => !productFixtures.find((f) => f.sku === p.sku));

  for (const product of otherProducts) {
    const carriedStores: Store[] = [];
    const carryCount = randInt(2, 6);

    const shuffledStores = [...stores].sort(() => random() - 0.5);
    for (let i = 0; i < carryCount; i++) {
      carriedStores.push(shuffledStores[i]);
    }

    if (montKiaraCount < 212) {
      if (!carriedStores.find((s) => s.id === "mont-kiara")) {
        carriedStores.push(stores[0]);
      }
      montKiaraCount++;
    } else if (carriedStores.find((s) => s.id === "mont-kiara")) {
      const idx = carriedStores.findIndex((s) => s.id === "mont-kiara");
      carriedStores.splice(idx, 1);
    }

    const rows: StockRow[] = carriedStores.map((store) => {
      const onHand = randInt(0, 50);
      const reorderLevel = randInt(0, 20);
      return { storeId: store.id, onHand, reorderLevel };
    });

    stockRows.set(product.sku, rows);
  }

  for (const [sku, rows] of Object.entries(FIXTURE_STOCK)) {
    stockRows.set(sku, rows);
  }

  return stockRows;
}

let transferCounter = 1;
const managerId = "aina-rahman";
const writeOffReasons = ["Expired", "Damaged", "Spilled", "Stock count correction"];
const receiveReasons = ["PO-7781", "PO-8823", "PO-9901", null];

function generateProductMovements(
  product: Product,
  stockRows: StockRow[],
  now: Date,
  ninetyDaysAgo: Date,
  todayStr: string,
  currentYear: string,
): Movement[] {
  const storeMovements: Map<string, Movement[]> = new Map();
  const balances: Map<string, number> = new Map();
  const lastTime: Map<string, number> = new Map();

  for (const row of stockRows) {
    storeMovements.set(row.storeId, []);
    balances.set(row.storeId, row.onHand);
  }

  const isHero = product.sku === "KL-1042";

  // Target counts per store
  const targetCounts: Map<string, number> = new Map();
  if (isHero) {
    targetCounts.set("mont-kiara", 35);
    targetCounts.set("subang", 20);
    targetCounts.set("cheras", 15);
    targetCounts.set("damansara", 25);
    targetCounts.set("puchong", 15);
    targetCounts.set("shah-alam", 18);
  } else {
    for (const row of stockRows) {
      const r = randomMove();
      const count = r < 0.05 ? randIntMove(1, 2) : randIntMove(3, 14);
      targetCounts.set(row.storeId, count);
    }
  }

  // Anchor newest times
  const montKiaraHeroTime = new Date(`${todayStr}T10:42:00+08:00`).getTime();
  const cherasHeroTime = new Date(`${currentYear}-10-09T14:30:00+08:00`).getTime();

  for (const row of stockRows) {
    if (isHero) {
      if (row.storeId === "mont-kiara") {
        lastTime.set(row.storeId, montKiaraHeroTime);
      } else if (row.storeId === "cheras") {
        lastTime.set(row.storeId, cherasHeroTime);
      } else {
        const offset = randIntMove(2, 48) * 60 * 60 * 1000;
        lastTime.set(row.storeId, montKiaraHeroTime - offset);
      }
    } else {
      const offset = Math.floor(randomMove() * 3 * 24 * 60 * 60 * 1000);
      lastTime.set(row.storeId, now.getTime() - offset);
    }
  }

  let transfersWanted = 0;
  if (stockRows.length >= 2) {
    if (isHero) {
      transfersWanted = 2;
    } else if (randomMove() < 0.12) {
      transfersWanted = 1;
    }
  }

  for (const row of stockRows) {
    const storeId = row.storeId;
    const totalMoves = targetCounts.get(storeId) ?? 5;
    const newestT = lastTime.get(storeId) ?? now.getTime();
    const oldestT = ninetyDaysAgo.getTime() + Math.floor(randomMove() * 10 * 24 * 60 * 60 * 1000);

    const timestamps: number[] = [];
    if (totalMoves === 1) {
      timestamps.push(newestT);
    } else {
      const span = newestT - oldestT;
      const rawTimes = [oldestT, newestT];
      for (let i = 0; i < totalMoves - 2; i++) {
        rawTimes.push(oldestT + Math.floor(randomMove() * span));
      }
      rawTimes.sort((a, b) => a - b);
      for (let i = 0; i < rawTimes.length; i++) {
        let t = rawTimes[i];
        if (i > 0 && t <= timestamps[i - 1]) {
          t = timestamps[i - 1] + 60 * 1000;
        }
        timestamps.push(t);
      }
      timestamps[timestamps.length - 1] = newestT;
    }

    const backwardList: Movement[] = [];
    let b = balances.get(storeId) ?? 0;

    for (let i = totalMoves - 1; i >= 0; i--) {
      const t = timestamps[i];
      const isFirstInTime = i === 0;

      let type: Movement["type"];
      let quantity: number;
      let reason: string | null = null;
      let userId: string;

      if (isFirstInTime) {
        if (b > 0) {
          type = "receive";
          quantity = b;
          reason = pickMove(receiveReasons);
          userId = pickMove(users).id;
        } else {
          const q = randIntMove(1, 5);
          type = "sell";
          quantity = -q;
          reason = null;
          userId = pickMove(users).id;
        }
      } else {
        if (b === 0) {
          const isWriteOff = randomMove() < 0.2;
          const q = randIntMove(1, 10);
          if (isWriteOff) {
            type = "write_off";
            quantity = -q;
            reason = pickMove(writeOffReasons);
            userId = managerId;
          } else {
            type = "sell";
            quantity = -q;
            reason = null;
            userId = pickMove(users).id;
          }
        } else {
          const r = randomMove();
          if (r < 0.45) {
            const q = randIntMove(1, Math.min(b, 20));
            type = "receive";
            quantity = q;
            reason = pickMove(receiveReasons);
            userId = pickMove(users).id;
          } else if (r < 0.85) {
            const q = randIntMove(1, 15);
            type = "sell";
            quantity = -q;
            reason = null;
            userId = pickMove(users).id;
          } else {
            const q = randIntMove(1, 5);
            type = "write_off";
            quantity = -q;
            reason = pickMove(writeOffReasons);
            userId = managerId;
          }
        }
      }

      backwardList.push({
        productId: product.sku,
        storeId,
        type,
        quantity,
        balanceAfter: b,
        reason,
        transferId: null,
        createdAt: new Date(t).toISOString(),
        userId,
      });

      b = b - quantity;
    }

    backwardList.reverse();
    storeMovements.set(storeId, backwardList);
  }

  // Insert transfers between stores
  if (transfersWanted > 0 && stockRows.length >= 2) {
    const storeIds = stockRows.map((r) => r.storeId);
    let transfersDone = 0;

    for (let aIdx = 0; aIdx < storeIds.length && transfersDone < transfersWanted; aIdx++) {
      for (let bIdx = 0; bIdx < storeIds.length && transfersDone < transfersWanted; bIdx++) {
        if (aIdx === bIdx) continue;
        const sA = storeIds[aIdx];
        const sB = storeIds[bIdx];
        const movesA = storeMovements.get(sA);
        const movesB = storeMovements.get(sB);
        if (!movesA || !movesB || movesA.length < 3 || movesB.length < 3) continue;

        for (let i = 1; i < movesA.length - 1 && transfersDone < transfersWanted; i++) {
          const tA_prev = new Date(movesA[i - 1].createdAt).getTime();
          const tA_next = new Date(movesA[i + 1].createdAt).getTime();

          for (let j = 1; j < movesB.length - 1 && transfersDone < transfersWanted; j++) {
            const tB_prev = new Date(movesB[j - 1].createdAt).getTime();
            const tB_next = new Date(movesB[j + 1].createdAt).getTime();

            const overlapMin = Math.max(tA_prev, tB_prev) + 60000;
            const overlapMax = Math.min(tA_next, tB_next) - 60000;

            if (overlapMin < overlapMax) {
              const mA = movesA[i];
              const mB = movesB[j];

              if (
                mA.quantity < 0 &&
                mB.quantity > 0 &&
                Math.abs(mA.quantity) === mB.quantity &&
                !mA.transferId &&
                !mB.transferId
              ) {
                const transferTime = new Date(Math.floor((overlapMin + overlapMax) / 2)).toISOString();
                const transferId = `transfer-${product.sku}-${transferCounter++}`;

                mA.type = "transfer_out";
                mA.transferId = transferId;
                mA.reason = "Stock transfer";
                mA.userId = managerId;
                mA.createdAt = transferTime;

                mB.type = "transfer_in";
                mB.transferId = transferId;
                mB.reason = "Stock transfer";
                mB.userId = managerId;
                mB.createdAt = transferTime;

                transfersDone++;
                break;
              }
            }
          }
        }
      }
    }
  }

  const result: Movement[] = [];
  for (const list of storeMovements.values()) {
    result.push(...list);
  }
  return result;
}

function generateSeed() {
  const dataDir = `${__dirname}/../data`;
  const seedPath = `${dataDir}/seed.json`;

  let existingSeed: {
    stores: Store[];
    categories: Category[];
    suppliers: Supplier[];
    users: User[];
    products: Product[];
    stock: Record<string, StockRow[]>;
    movements: Movement[];
  } | null = null;

  if (existsSync(seedPath)) {
    try {
      existingSeed = JSON.parse(readFileSync(seedPath, "utf-8"));
    } catch {
      existingSeed = null;
    }
  }

  let finalProducts = generateProducts();
  const productFixtures = finalProducts.filter((p) =>
    ["KL-1042", "KL-1043", "KL-2210"].includes(p.sku),
  );
  let finalStockMap: Record<string, StockRow[]> = Object.fromEntries(
    generateStockRows(finalProducts, productFixtures),
  );

  const otherProducts = finalProducts.filter(
    (p) => !productFixtures.find((f) => f.sku === p.sku),
  );
  const randomProduct = pick(otherProducts.slice(2));
  const randomStock = finalStockMap[randomProduct.sku];
  if (randomStock && randomStock.length > 0) {
    randomStock[0].reorderLevel = 0;
  }

  let differed = false;
  let movements: Movement[] = [];

  if (existingSeed) {
    finalProducts = makeProductsUnique(existingSeed.products);
    finalStockMap = existingSeed.stock;
    movements = existingSeed.movements;
  } else {
    finalProducts = makeProductsUnique(finalProducts);

    const now = new Date();
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
    }).format(now);
    const currentYear = todayStr.split("-")[0];
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    for (const product of finalProducts) {
      const rows = finalStockMap[product.sku] || [];
      movements.push(
        ...generateProductMovements(
          product,
          rows,
          now,
          ninetyDaysAgo,
          todayStr,
          currentYear,
        ),
      );
    }

    movements.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  return {
    differed,
    seed: {
      stores: existingSeed ? existingSeed.stores : stores,
      categories: existingSeed ? existingSeed.categories : categories,
      suppliers: existingSeed ? existingSeed.suppliers : suppliers,
      users: existingSeed ? existingSeed.users : users,
      products: finalProducts,
      stock: finalStockMap,
      movements,
    },
  };
}

const { differed, seed } = generateSeed();
const dataDir = `${__dirname}/../data`;
const seedPath = `${dataDir}/seed.json`;

writeFileSync(seedPath, JSON.stringify(seed, null, 2), "utf-8");
console.log(
  `Generated seed.json with ${seed.products.length} products and ${seed.movements.length} movements. (differed: ${differed})`,
);
