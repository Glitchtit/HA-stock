// Run with `npm test` (node's built-in test runner).
import test from 'node:test';
import assert from 'node:assert/strict';
import { stockText, groupCount } from './stockFormat.js';

const UNITS = new Map([[1, 'g'], [3, 'l'], [16, 'kpl']]);
const eggs = { content_amount: 10, content_unit_id: 16 };
const pasta = { content_amount: 500, content_unit_id: 1 };
const milk = { content_amount: 1, content_unit_id: 3 };

test('whole packs stay a pack count', () => {
  assert.equal(stockText(2, 0, milk, UNITS), '2 in stock');
});

test('a partly used carton of eggs shows the eggs left', () => {
  assert.equal(stockText(0.7, 0.7, eggs, UNITS), '7 kpl in stock (1 opened)');
});

test('a partly used pack of pasta shows the grams left', () => {
  assert.equal(stockText(0.4, 0.4, pasta, UNITS), '200 g in stock (1 opened)');
});

test('litres keep one decimal with a Finnish comma', () => {
  assert.equal(stockText(1.4, 0.4, milk, UNITS), '1,4 l in stock (1 opened)');
});

test('half an egg is not a thing: counts round, marked approximate', () => {
  assert.equal(stockText(0.35, 0.35, eggs, UNITS), '≈4 kpl in stock (1 opened)');
});

test('without content facts a partial pack shows its fraction', () => {
  assert.equal(stockText(0.7, 0, {}, UNITS), '0,7 in stock');
  assert.equal(stockText(0.7, 0, { content_amount: 10, content_unit_id: 99 }, UNITS), '0,7 in stock');
  assert.equal(stockText(0.7, 0, undefined, undefined), '0,7 in stock');
});

test('a whole opened pack still says it is opened', () => {
  assert.equal(stockText(2, 1, milk, UNITS), '2 in stock (1 opened)');
});

test('group header counts products, not summed pack fractions', () => {
  assert.equal(groupCount([{ amount: 0.7 }, { amount: 1 }, { amount: 0.9 }]), 3);
});
