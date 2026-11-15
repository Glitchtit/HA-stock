// Pure helpers for the inventory count: what to add or consume at Finish, and
// which counts to keep when some of those adjustments fail. No React or
// browser APIs, so `npm test` (node's built-in runner) covers them.

// Units one scan of a product's barcode stands for (a 6-pack barcode is 6).
export function scanUnits(product) {
  const n = Number(product?.matched_pack_size);
  return n > 0 ? n : 1;
}

// counts: { productId: counted units }; stockRows: the fresh GET /stock rows.
// Returns [{ product_id, action: 'add' | 'consume', amount }] for every
// counted product whose count differs from its stock.
export function inventoryAdjustments(counts, stockRows) {
  const current = new Map();
  for (const row of stockRows ?? []) {
    const amount = parseFloat(row.amount);
    if (Number.isFinite(amount)) {
      current.set(row.product_id, (current.get(row.product_id) ?? 0) + amount);
    }
  }
  const adjustments = [];
  for (const [pidStr, counted] of Object.entries(counts)) {
    const pid = Number(pidStr);
    const delta = counted - (current.get(pid) ?? 0);
    if (delta > 0) adjustments.push({ product_id: pid, action: 'add', amount: delta });
    else if (delta < 0) adjustments.push({ product_id: pid, action: 'consume', amount: -delta });
  }
  return adjustments;
}

// The counts to keep after committing: only those of products whose
// adjustment failed (results from Promise.allSettled, in adjustment order),
// so a retry applies only what is still missing.
export function countsToKeep(counts, adjustments, results) {
  const keep = {};
  adjustments.forEach((adj, i) => {
    if (results[i]?.status === 'rejected' && counts[adj.product_id] != null) {
      keep[adj.product_id] = counts[adj.product_id];
    }
  });
  return keep;
}
