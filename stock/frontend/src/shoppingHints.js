// Pure helpers for shopping-list rows: requirement rows, buy hints, the ±
// stepper, the price estimate, print rows and the shopping-trip basket. No
// React or browser APIs, so `npm test` (node's built-in runner) covers them.

const NOTE_SENTINEL_NAME = 'Muistilappu';

// Rows measured in grams or millilitres are recipe requirements ("3,5 dl"),
// not package counts.
export function isRequirementRow(item) {
  const dim = item?.display?.unit_dimension;
  return dim === 'mass' || dim === 'volume';
}

// The "Osta …" line under a row: for a requirement, how many packages cover
// it (first, so a long name cannot push it out of view), then which product
// to pick up ('' when there is nothing to add). nameShown: the row's name
// already is the product to buy, so only the count is left to say.
export function buyHintText(item, nameShown = false) {
  const d = item?.display;
  if (!d?.buy_product_id) return '';
  const other = d.buy_product_id !== item.product_id && !nameShown;
  if (!isRequirementRow(item) && d.unit_dimension !== 'count') {
    return other ? `Osta: ${d.buy_product_name}` : '';
  }
  const count = `${d.approx ? '≈' : ''}${d.buy_count} pkt`;
  return other ? `Osta ${count}: ${d.buy_product_name}` : `Osta ${count}`;
}

// The product a row is shown as: the product to buy when Storage picked one
// for a generic row and the app has it loaded, else the row's own product.
export function shownProduct(item, productById) {
  const own = productById.get(item?.product_id);
  const buyId = item?.display?.buy_product_id;
  if (buyId == null || buyId === item?.product_id) return own;
  return productById.get(buyId) ?? own;
}

// The small line under the name: the generic item the shown product stands
// for, then the row's note.
export function rowContext(item, rowProduct, shown) {
  const parts = [];
  if (shown && rowProduct && shown.id !== rowProduct.id) parts.push(rowProduct.name);
  if (item?.note) parts.push(`📝 ${item.note}`);
  return parts.join(' · ');
}

// Variant chips offer a choice; a single variant leaves none.
export function variantChips(variants) {
  return (variants?.length ?? 0) >= 2 ? variants : [];
}

// Buy products the app has not loaded yet (found by Storage moments ago).
export function unknownBuyProducts(list, productById) {
  const ids = new Set();
  for (const item of list || []) {
    const id = item?.display?.buy_product_id;
    if (id != null && !item.done && !productById.has(id)) ids.add(id);
  }
  return [...ids].sort((a, b) => a - b);
}

// The scraper runs one job at a time (409 while busy). Storage's background
// product search can hold it for a while, so the quick-add search waits about
// 45 seconds before giving up: the delay before retry N, or null to stop.
export function busyRetryDelay(retries) {
  return retries < 30 ? 1500 : null;
}

// What one press of the ± stepper does. A requirement row steps its package
// count and becomes a package row (unit_id null); other rows step their own
// amount. Below one, the row goes.
export function stepTarget(item, delta) {
  if (isRequirementRow(item)) {
    const count = item.display.buy_count || 1;
    if (delta < 0 && count <= 1) return { remove: true };
    return { body: { amount: count + delta, unit_id: null } };
  }
  const amount = parseFloat(item?.amount ?? 1) || 1;
  if (delta < 0 && amount <= 1) return { remove: true };
  return { body: { amount: amount + delta } };
}

// Estimated price of the open rows: packages to buy × the unit price of the
// product to buy. Rows without a price, and requirements Storage could not
// count, add nothing.
export function estimatedTotal(list, productById) {
  let sum = 0;
  for (const item of list || []) {
    if (item.done || item.product_id == null) continue;
    const d = item.display || {};
    const price = productById.get(d.buy_product_id ?? item.product_id)?.unit_price;
    if (price == null) continue;
    let count = d.buy_count;
    if (count == null) {
      if (d.unit_dimension && d.unit_dimension !== 'package') continue;
      count = parseFloat(item.amount) || 1;
    }
    sum += count * price;
  }
  return sum;
}

// One shopping row as HA-print's /print/shopping-list item. Notes print
// their text as the item.
export function printRow(item, product) {
  const isNote = product?.name === NOTE_SENTINEL_NAME;
  return {
    name: isNote
      ? (item.note || NOTE_SENTINEL_NAME)
      : (product?.name ?? item.ha_item_name ?? `#${item.product_id}`),
    amount: parseFloat(item.amount ?? 1) || 1,
    unit: isNote ? '' : (item.display?.unit_abbr || ''),
    qty_text: isNote ? '' : (item.display?.qty_text || ''),
    done: !!item.done,
    note: isNote ? '' : (item.note || ''),
  };
}

// Shopping rows as the app keeps them: numeric amount, boolean flags.
export function normalizeShoppingRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    amount: parseFloat(row.amount ?? 1),
    done: !!row.done,
    auto_added: !!row.auto_added,
  }));
}

// Basket items to apply once more when a trip finishes: those whose scan
// cleared nothing (they may have been linked under a generic item since).
export function basketToApply(basket) {
  return (basket || []).filter((b) => !b.cleared)
    .map(({ product_id, amount }) => ({ product_id, amount }));
}

// Correcting an over-scan takes `amount` of the product out of the basket,
// newest scans first.
export function removeFromBasket(basket, productId, amount) {
  let left = amount;
  const out = [...basket];
  for (let i = out.length - 1; i >= 0 && left > 0; i -= 1) {
    if (out[i].product_id !== productId) continue;
    const take = Math.min(left, out[i].amount);
    left -= take;
    if (out[i].amount - take <= 0) out.splice(i, 1);
    else out[i] = { ...out[i], amount: out[i].amount - take };
  }
  return out;
}

function rowNames(rows, nameById) {
  return [...new Set((rows || []).map((r) => nameById.get(r.product_id)).filter(Boolean))];
}

// Toast text for the rows a purchase took off (or down) the list.
export function clearedToast(clearedRows, nameById) {
  const names = rowNames(clearedRows, nameById);
  return names.length ? `Ostoslistalta: ${names.join(', ')}` : '';
}

// Toast text for the rows an undone scan (swipe −1) put back on the list.
export function restoredToast(restoredRows, nameById) {
  const names = rowNames(restoredRows, nameById);
  return names.length ? `Palautettu listalle: ${names.join(', ')}` : '';
}
