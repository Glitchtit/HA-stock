// Run with `npm test` (node's built-in test runner; no extra dependencies).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  basketToApply, buyHintText, clearedToast, estimatedTotal, isRequirementRow,
  normalizeShoppingRows, printRow, removeFromBasket, stepTarget,
} from './shoppingHints.js';

const display = (dim, extra = {}) => ({ qty_text: '1', unit_abbr: null, unit_dimension: dim, ...extra });

test('mass and volume rows are requirements; packages and pieces are not', () => {
  assert.equal(isRequirementRow({ display: display('volume') }), true);
  assert.equal(isRequirementRow({ display: display('mass') }), true);
  assert.equal(isRequirementRow({ display: display('package') }), false);
  assert.equal(isRequirementRow({ display: display('count') }), false);
  assert.equal(isRequirementRow({}), false);
});

test('the buy hint says how many packages, then which product (the count survives truncation)', () => {
  const concept = { product_id: 1, display: display('volume', {
    buy_product_id: 7, buy_product_name: 'Vispikerma 2 dl', buy_count: 2, approx: false }) };
  assert.equal(buyHintText(concept), 'Osta 2 pkt: Vispikerma 2 dl');
  const estimated = { product_id: 1, display: display('mass', {
    buy_product_id: 8, buy_product_name: 'Vehnäjauho 2 kg', buy_count: 1, approx: true }) };
  assert.equal(buyHintText(estimated), 'Osta ≈1 pkt: Vehnäjauho 2 kg');
  const packages = { product_id: 1, display: display('package', {
    buy_product_id: 9, buy_product_name: 'Kevytmaito 1 l', buy_count: 2 }) };
  assert.equal(buyHintText(packages), 'Osta: Kevytmaito 1 l');
});

test('a product bought as itself needs a hint only for a requirement', () => {
  const sku = { product_id: 5, display: display('package', { buy_product_id: 5, buy_product_name: 'X', buy_count: 3 }) };
  assert.equal(buyHintText(sku), '');
  const need = { product_id: 5, display: display('volume', { buy_product_id: 5, buy_product_name: 'X', buy_count: 2 }) };
  assert.equal(buyHintText(need), 'Osta 2 pkt');
  assert.equal(buyHintText({ product_id: 5, display: display('package') }), '');
});

test('the stepper turns a requirement into packages and steps other rows by one', () => {
  const need = { amount: 3, display: display('volume', { buy_count: 2 }) };
  assert.deepEqual(stepTarget(need, +1), { body: { amount: 3, unit_id: null } });
  assert.deepEqual(stepTarget(need, -1), { body: { amount: 1, unit_id: null } });
  assert.deepEqual(stepTarget({ amount: 3, display: display('mass', { buy_count: 1 }) }, -1), { remove: true });
  assert.deepEqual(stepTarget({ amount: 2, display: display('package') }, +1), { body: { amount: 3 } });
  assert.deepEqual(stepTarget({ amount: 1, display: display('package') }, -1), { remove: true });
  assert.deepEqual(stepTarget({ amount: 1.5, display: display('count') }, -1), { body: { amount: 0.5 } });
});

test('the estimated total prices the product to buy and skips done rows', () => {
  const prices = new Map([[7, { unit_price: 1.5 }], [2, { unit_price: 3 }], [3, { unit_price: 10 }]]);
  const list = [
    { product_id: 1, amount: 3, display: display('volume', { buy_product_id: 7, buy_count: 2 }) },
    { product_id: 2, amount: 2, display: display('package', { buy_product_id: 2, buy_count: 2 }) },
    { product_id: 3, amount: 1, done: true, display: display('package', { buy_product_id: 3, buy_count: 1 }) },
    { product_id: 4, amount: 1, display: display('package', { buy_product_id: 4, buy_count: 1 }) },
    { product_id: 2, amount: 2 },
  ];
  assert.equal(estimatedTotal(list, prices), 2 * 1.5 + 2 * 3 + 2 * 3);
});

test('print rows send Storage\'s quantity text, notes print their text', () => {
  const item = { product_id: 1, amount: 3.5, note: 'Reseptistä: A',
    display: display('volume', { qty_text: '3,5 dl', unit_abbr: 'dl' }) };
  assert.deepEqual(printRow(item, { name: 'Kerma' }),
    { name: 'Kerma', amount: 3.5, unit: 'dl', qty_text: '3,5 dl', done: false, note: 'Reseptistä: A' });
  assert.deepEqual(printRow({ product_id: 2, amount: 1, note: 'Kakku' }, { name: 'Muistilappu' }),
    { name: 'Kakku', amount: 1, unit: '', qty_text: '', done: false, note: '' });
});

test('rows from the API get numeric amounts and boolean flags', () => {
  assert.deepEqual(normalizeShoppingRows([{ id: 1, amount: '2.5', done: 0, auto_added: 1 }]),
    [{ id: 1, amount: 2.5, done: false, auto_added: true }]);
  assert.deepEqual(normalizeShoppingRows(null), []);
});

test('only basket items whose scan cleared nothing are applied again', () => {
  const basket = [
    { product_id: 1, amount: 1, cleared: true },
    { product_id: 2, amount: 6, cleared: false },
  ];
  assert.deepEqual(basketToApply(basket), [{ product_id: 2, amount: 6 }]);
});

test('correcting an over-scan takes the newest scans of that product out of the basket', () => {
  const basket = [
    { product_id: 1, amount: 2, cleared: false },
    { product_id: 2, amount: 1, cleared: true },
    { product_id: 1, amount: 1, cleared: true },
  ];
  assert.deepEqual(removeFromBasket(basket, 1, 2), [
    { product_id: 1, amount: 1, cleared: false },
    { product_id: 2, amount: 1, cleared: true },
  ]);
});

test('the toast names the rows a purchase took off the list', () => {
  const names = new Map([[1, 'Maito'], [2, 'Kerma']]);
  assert.equal(clearedToast([{ id: 9, product_id: 1, removed: true, amount: 0 },
    { id: 8, product_id: 2, removed: false, amount: 1 }], names), 'Ostoslistalta: Maito, Kerma');
  assert.equal(clearedToast([], names), '');
});
