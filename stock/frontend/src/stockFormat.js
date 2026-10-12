// Pure helpers for the stock list's amounts. Cooking takes part of a pack
// ("0.7" of a carton of eggs), so a partial pack is shown in what it holds
// ("7 kpl") when the product's content is known.

const fi = (n, digits) => n.toLocaleString('fi-FI', { maximumFractionDigits: digits });

function contentText(amount, product, unitAbbrById) {
  const per = Number(product?.content_amount);
  const abbr = unitAbbrById?.get(product?.content_unit_id);
  if (!(per > 0) || !abbr) return null;
  const total = amount * per;
  if (abbr === 'kpl') {
    const whole = Math.round(total);
    return `${Math.abs(total - whole) < 0.01 ? '' : '≈'}${whole} kpl`;
  }
  return `${fi(total, abbr === 'g' || abbr === 'ml' ? 0 : 1)} ${abbr}`;
}

// "2 in stock", "7 kpl in stock (1 opened)", "0,7 in stock".
export function stockText(amount, amountOpened, product, unitAbbrById) {
  const n = Number(amount) || 0;
  const whole = Math.abs(n - Math.round(n)) < 0.001;
  const qty = whole ? String(Math.round(n)) : contentText(n, product, unitAbbrById) ?? fi(n, 2);
  // Any part of a pack open counts as one opened pack.
  const opened = Math.ceil((Number(amountOpened) || 0) - 0.001);
  return opened > 0 ? `${qty} in stock (${opened} opened)` : `${qty} in stock`;
}

// A product group's header badge: how many products it holds. Summing pack
// fractions of different products ("2.60") means nothing.
export function groupCount(items) {
  return items.length;
}
