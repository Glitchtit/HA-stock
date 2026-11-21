// Pure helper for the receipt scan: which parsed lines go to POST
// /receipts/commit, and with what. No React or browser APIs, so `npm test`
// (node's built-in runner) covers it.

// lines: parsed receipt lines from /receipts/parse ({ price, ... });
// overrides: { [lineIndex]: { ignored, qty, productId, unitId } } from the
// review sheet. A line's price is the total printed on the receipt for that
// line; Storage divides it by the amount and records it as the price paid.
export function receiptCommitLines(lines, overrides) {
  return (lines || [])
    .map((line, idx) => ({ line, ov: overrides?.[idx] }))
    .filter(({ ov }) => ov && !ov.ignored && ov.productId)
    .map(({ line, ov }) => {
      const out = {
        product_id: ov.productId,
        amount: Number(ov.qty) || 1,
        unit_id: ov.unitId,
        note: 'receipt',
      };
      const price = Number(line?.price);
      if (line?.price != null && Number.isFinite(price) && price > 0) out.price_paid = price;
      return out;
    });
}
