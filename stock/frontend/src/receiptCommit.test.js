// Run with `npm test` (node's built-in test runner; no extra dependencies).
import test from 'node:test';
import assert from 'node:assert/strict';
import { receiptCommitLines } from './receiptCommit.js';

const ov = (productId, extra = {}) => ({ ignored: false, qty: 1, productId, unitId: 3, ...extra });

test('the price printed on the line is sent as price_paid', () => {
  assert.deepEqual(receiptCommitLines([{ price: 2.49 }], { 0: ov(5, { qty: 2 }) }), [
    { product_id: 5, amount: 2, unit_id: 3, note: 'receipt', price_paid: 2.49 },
  ]);
});

test('a missing, zero, negative or unreadable price is left out', () => {
  const lines = [{ price: null }, {}, { price: 0 }, { price: -1 }, { price: 'abc' }, { price: Infinity }];
  const overrides = Object.fromEntries(lines.map((_, i) => [i, ov(i + 1)]));
  for (const row of receiptCommitLines(lines, overrides)) {
    assert.equal('price_paid' in row, false);
  }
});

test('ignored lines and lines without a product are dropped', () => {
  const lines = [{ price: 1 }, { price: 2 }, { price: 3 }, { price: 4 }];
  const overrides = { 0: ov(1, { ignored: true }), 1: ov(null), 3: ov(9) };
  assert.deepEqual(receiptCommitLines(lines, overrides).map((r) => r.product_id), [9]);
});

test('an empty or invalid quantity falls back to 1', () => {
  const lines = [{ price: 1 }, { price: 1 }, { price: 1 }];
  const overrides = { 0: ov(1, { qty: '' }), 1: ov(2, { qty: 'x' }), 2: ov(3, { qty: '0.5' }) };
  assert.deepEqual(receiptCommitLines(lines, overrides).map((r) => r.amount), [1, 1, 0.5]);
});
