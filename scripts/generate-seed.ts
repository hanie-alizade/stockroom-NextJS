/* eslint-disable max-lines */
import { writeFileSync } from "fs";
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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
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

  while (products.length < 3 + targetProducts) {
    const category = pick(categories);
    const names = categoryNames[category.name];
    const nameBase = pick(names);
    const sku = `KL-${skuCounter++}`;

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

function generateMovements(
  products: Product[],
  stockRows: Map<string, StockRow[]>,
  productFixtures: Product[],
): Movement[] {
  const movements: Movement[] = [];
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const otherProducts = products.filter((p) => !productFixtures.find((f) => f.sku === p.sku));

  const noMovementsSku = otherProducts[0].sku;
  const oneMovementSku = otherProducts[1].sku;

  for (const product of products) {
    if (product.sku === noMovementsSku) {
      continue;
    }

    if (product.sku === oneMovementSku) {
      const rows = stockRows.get(product.sku) || [];
      if (rows.length > 0) {
        const row = rows[0];
        const movement: Movement = {
          productId: product.sku,
          storeId: row.storeId,
          type: "receive",
          quantity: row.onHand,
          balanceAfter: row.onHand,
          reason: "Initial stock",
          transferId: null,
          createdAt: new Date(now.getTime() - randInt(1, 7) * 24 * 60 * 60 * 1000).toISOString(),
          userId: pick(users).id,
        };
        movements.push(movement);
      }
      continue;
    }

    const rows = stockRows.get(product.sku) || [];
    for (const row of rows) {
      const currentStock = row.onHand;
      const movementCount = randInt(5, 30);
      let remaining = currentStock;

      const timePoints: number[] = [];
      for (let i = 0; i < movementCount; i++) {
        timePoints.push(
          ninetyDaysAgo.getTime() + random() * (now.getTime() - ninetyDaysAgo.getTime()),
        );
      }
      timePoints.sort((a, b) => a - b);

      for (let i = 0; i < movementCount; i++) {
        const movementTime = new Date(timePoints[i]);
        const isLast = i === movementCount - 1;

        if (isLast) {
          const quantity = remaining;
          if (quantity > 0) {
            const movement: Movement = {
              productId: product.sku,
              storeId: row.storeId,
              type: "receive",
              quantity,
              balanceAfter: quantity,
              reason: pick(["PO-7781", "PO-8823", "PO-9901", null]),
              transferId: null,
              createdAt: movementTime.toISOString(),
              userId: pick(users).id,
            };
            movements.push(movement);
          }
        } else {
          const consume = randInt(0, Math.min(remaining, 10));
          remaining -= consume;

          if (consume > 0) {
            const movement: Movement = {
              productId: product.sku,
              storeId: row.storeId,
              type: pick(["sell", "write_off"]),
              quantity: -consume,
              balanceAfter: remaining,
              reason: pick(["Damaged", "Expired", "Sale", null]),
              transferId: null,
              createdAt: movementTime.toISOString(),
              userId: pick(users).id,
            };
            movements.push(movement);
          }
        }
      }
    }
  }

  movements.push(...generateTransfers(products, stockRows, now, ninetyDaysAgo));

  return movements;
}

function generateTransfers(
  products: Product[],
  stockRows: Map<string, StockRow[]>,
  now: Date,
  ninetyDaysAgo: Date,
): Movement[] {
  const movements: Movement[] = [];
  const transferCount = 20;

  for (let i = 0; i < transferCount; i++) {
    const fromStore = pick(stores);
    const toStore = pick(stores.filter((s) => s.id !== fromStore.id));
    const product = pick(products);
    const rows = stockRows.get(product.sku) || [];
    const fromRow = rows.find((r) => r.storeId === fromStore.id);
    const toRow = rows.find((r) => r.storeId === toStore.id);

    if (fromRow && toRow && fromRow.onHand > 0) {
      const quantity = randInt(1, Math.min(fromRow.onHand, 10));
      const transferId = `transfer-${Date.now()}-${i}`;
      const transferTime = new Date(
        ninetyDaysAgo.getTime() + random() * (now.getTime() - ninetyDaysAgo.getTime()),
      ).toISOString();

      const outMovement: Movement = {
        productId: product.sku,
        storeId: fromStore.id,
        type: "transfer_out",
        quantity: -quantity,
        balanceAfter: fromRow.onHand - quantity,
        reason: "Stock transfer",
        transferId,
        createdAt: transferTime,
        userId: pick(users).id,
      };

      const inMovement: Movement = {
        productId: product.sku,
        storeId: toStore.id,
        type: "transfer_in",
        quantity,
        balanceAfter: toRow.onHand + quantity,
        reason: "Stock transfer",
        transferId,
        createdAt: transferTime,
        userId: pick(users).id,
      };

      movements.push(outMovement, inMovement);
    }
  }

  return movements;
}

function generateSeed() {
  const products = generateProducts();
  const productFixtures = products.filter((p) => ["KL-1042", "KL-1043", "KL-2210"].includes(p.sku));
  const stockRows = generateStockRows(products, productFixtures);
  const movements = generateMovements(products, stockRows, productFixtures);

  const seed = {
    stores,
    categories,
    suppliers,
    users,
    products,
    stock: Object.fromEntries(stockRows),
    movements,
  };

  const otherProducts = products.filter((p) => !productFixtures.find((f) => f.sku === p.sku));
  const randomProduct = pick(otherProducts.slice(2));
  const randomStock = stockRows.get(randomProduct.sku);
  if (randomStock && randomStock.length > 0) {
    randomStock[0].reorderLevel = 0;
    seed.stock[randomProduct.sku] = randomStock;
  }

  return seed;
}

const seed = generateSeed();
const dataDir = `${__dirname}/../data`;
const seedPath = `${dataDir}/seed.json`;

writeFileSync(seedPath, JSON.stringify(seed, null, 2), "utf-8");
