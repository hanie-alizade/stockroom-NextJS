import fs from "node:fs";
import path from "node:path";

interface ProductSeed {
  sku: string;
  name: string;
  category: string;
  supplier?: string;
  unitCostSen: number;
}

interface StockSeed {
  storeId: string;
  onHand: number;
  reorderLevel: number;
}

interface SeedData {
  products: ProductSeed[];
  stock: Record<string, StockSeed[]>;
  categories: { name: string }[];
}

function escapeCsvField(val: string | number | undefined): string {
  const str = val === undefined ? "" : String(val);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Deterministically generates samples/import-sample.csv from data/seed.json.
 * Contains at least 60 rows with varied existing, new, unchanged, and invalid rows.
 */
function generateSample(): void {
  const seedPath = path.resolve(process.cwd(), "data/seed.json");
  const rawSeed = fs.readFileSync(seedPath, "utf-8");
  const seed: SeedData = JSON.parse(rawSeed);

  const rows: Array<Record<string, string | number>> = [];
  const storeId = "mont-kiara";

  // 1. 5 unchanged SKUs (products 0..4)
  for (let i = 0; i < 5; i++) {
    const p = seed.products[i];
    const stockList = seed.stock[p.sku] ?? [];
    const stock = stockList.find((s) => s.storeId === storeId);
    const onHand = stock ? stock.onHand : 0;
    const costRm = (p.unitCostSen / 100).toFixed(2);

    rows.push({
      "Item code": p.sku,
      Description: p.name,
      Group: p.category,
      Qty: onHand,
      "Cost (RM)": costRm,
      Barcode: `95500000000${i + 1}`,
      Supplier: p.supplier ?? "Kopi Lane roastery",
    });
  }

  // 2. 15 existing SKUs with changed quantity (products 5..19)
  for (let i = 5; i < 20; i++) {
    const p = seed.products[i];
    const stockList = seed.stock[p.sku] ?? [];
    const stock = stockList.find((s) => s.storeId === storeId);
    const onHand = stock ? stock.onHand : 0;
    const costRm = (p.unitCostSen / 100).toFixed(2);

    rows.push({
      "Item code": p.sku,
      Description: p.name,
      Group: p.category,
      Qty: onHand + 10,
      "Cost (RM)": costRm,
      Barcode: `9550000000${i + 1}`,
      Supplier: p.supplier ?? "Kopi Lane roastery",
    });
  }

  // 3. 20 more existing SKUs (products 20..39)
  for (let i = 20; i < 40; i++) {
    const p = seed.products[i];
    const stockList = seed.stock[p.sku] ?? [];
    const stock = stockList.find((s) => s.storeId === storeId);
    const onHand = stock ? stock.onHand : 0;
    const costRm = (p.unitCostSen / 100).toFixed(2);

    rows.push({
      "Item code": p.sku,
      Description: p.name,
      Group: p.category,
      Qty: onHand + 5,
      "Cost (RM)": costRm,
      Barcode: `955000000${i + 1}`,
      Supplier: p.supplier ?? "Kopi Lane roastery",
    });
  }

  // 4. 15 new SKUs
  const validCategories = seed.categories.map((c) => c.name);
  for (let i = 1; i <= 15; i++) {
    const sku = `NEW-${1000 + i}`;
    const name = `Special Roast Blend ${i}`;
    const category = validCategories[(i - 1) % validCategories.length];
    const costRm = (18.5 + (i % 5)).toFixed(2);

    rows.push({
      "Item code": sku,
      Description: name,
      Group: category,
      Qty: 25 + i,
      "Cost (RM)": costRm,
      Barcode: `9558888000${i < 10 ? "0" + i : i}`,
      Supplier: "Craft Beans Co.",
    });
  }

  // 5. At least 8 broken rows
  // 5.1 Missing SKU
  rows.push({
    "Item code": "",
    Description: "Missing SKU Product",
    Group: "Coffee",
    Qty: 10,
    "Cost (RM)": "12.00",
    Barcode: "955999000001",
    Supplier: "PackRight",
  });

  // 5.2 Negative quantity
  rows.push({
    "Item code": "BAD-NEG-QTY",
    Description: "Negative Qty Product",
    Group: "Tea",
    Qty: -5,
    "Cost (RM)": "8.50",
    Barcode: "955999000002",
    Supplier: "Highland Roasters",
  });

  // 5.3 Decimal quantity
  rows.push({
    "Item code": "BAD-DEC-QTY",
    Description: "Decimal Qty Product",
    Group: "Bakery",
    Qty: "4.5",
    "Cost (RM)": "6.00",
    Barcode: "955999000003",
    Supplier: "Golden Crumb Bakery",
  });

  // 5.4 Cost "thirty"
  rows.push({
    "Item code": "BAD-COST-TEXT",
    Description: "Word Cost Product",
    Group: "Packaging",
    Qty: 10,
    "Cost (RM)": "thirty",
    Barcode: "955999000004",
    Supplier: "PackRight",
  });

  // 5.5 Missing cost
  rows.push({
    "Item code": "BAD-NO-COST",
    Description: "Missing Cost Product",
    Group: "Syrups",
    Qty: 12,
    "Cost (RM)": "",
    Barcode: "955999000005",
    Supplier: "Sweet Bar Co.",
  });

  // 5.6 Unknown category "Snacks"
  rows.push({
    "Item code": "BAD-CATEGORY",
    Description: "Snack Chips Product",
    Group: "Snacks",
    Qty: 25,
    "Cost (RM)": "4.00",
    Barcode: "955999000006",
    Supplier: "Snack Brands",
  });

  // 5.7 Duplicate SKU (same SKU as row 1, seed.products[0].sku)
  rows.push({
    "Item code": seed.products[0].sku,
    Description: "Duplicate Product Row",
    Group: "Coffee",
    Qty: 100,
    "Cost (RM)": "68.00",
    Barcode: "955999000007",
    Supplier: "Highland Roasters",
  });

  // 5.8 Too-long name (> 120 chars)
  const longName = "A".repeat(125);
  rows.push({
    "Item code": "BAD-LONG-NAME",
    Description: longName,
    Group: "Coffee",
    Qty: 15,
    "Cost (RM)": "22.00",
    Barcode: "955999000008",
    Supplier: "Highland Roasters",
  });

  const headers = [
    "Item code",
    "Description",
    "Group",
    "Qty",
    "Cost (RM)",
    "Barcode",
    "Supplier",
  ];

  const csvLines = [headers.join(",")];
  for (const r of rows) {
    const line = headers.map((h) => escapeCsvField(r[h])).join(",");
    csvLines.push(line);
  }

  const outputContent = csvLines.join("\n") + "\n";
  const outputPath = path.resolve(process.cwd(), "samples/import-sample.csv");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, outputContent, "utf-8");
}

generateSample();
