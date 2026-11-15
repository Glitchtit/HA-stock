// Run with `npm test` (node's built-in test runner; no extra dependencies).
import test from 'node:test';
import assert from 'node:assert/strict';
import { countsToKeep, inventoryAdjustments, scanUnits } from './inventoryCount.js';

test('one scan of a 6-pack barcode counts 6, so Finish leaves stock of 6 alone', () => {
  const sixPack = { id: 7, matched_pack_size: 6 };
  const counts = { 7: scanUnits(sixPack) };
  assert.deepEqual(inventoryAdjustments(counts, [{ product_id: 7, amount: '6' }]), []);
});

test('a scan without a pack size counts 1', () => {
  assert.equal(scanUnits({ id: 1 }), 1);
  assert.equal(scanUnits({ id: 1, matched_pack_size: null }), 1);
  assert.equal(scanUnits({ id: 1, matched_pack_size: 0 }), 1);
});

test('deltas come from the stock passed in (the fresh fetch), adding and consuming', () => {
  const fresh = [
    { product_id: 1, amount: '2' },
    { product_id: 2, amount: 5 },
    { product_id: 3, amount: 4 },
  ];
  assert.deepEqual(inventoryAdjustments({ 1: 4, 2: 3, 3: 4, 9: 1 }, fresh), [
    { product_id: 1, action: 'add', amount: 2 },
    { product_id: 2, action: 'consume', amount: 2 },
    { product_id: 9, action: 'add', amount: 1 },
  ]);
});

test('only the products whose adjustment failed keep their count', () => {
  const counts = { 1: 4, 2: 3, 3: 4 };
  const adjustments = [
    { product_id: 1, action: 'add', amount: 2 },
    { product_id: 2, action: 'consume', amount: 2 },
  ];
  const results = [{ status: 'fulfilled' }, { status: 'rejected', reason: new Error('x') }];
  assert.deepEqual(countsToKeep(counts, adjustments, results), { 2: 3 });
  assert.deepEqual(countsToKeep(counts, adjustments, [{ status: 'fulfilled' }, { status: 'fulfilled' }]), {});
});
