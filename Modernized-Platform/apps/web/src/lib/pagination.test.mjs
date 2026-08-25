import assert from 'node:assert/strict';
import { lastPage, pageRangeLabel, pageWindow } from './pagination.ts';

assert.equal(lastPage(0, 12), 1);
assert.equal(lastPage(12, 12), 1);
assert.equal(lastPage(13, 12), 2);
assert.equal(lastPage(48, 12), 4);
assert.deepEqual(pageWindow(1, 1), [1]);
assert.deepEqual(pageWindow(1, 2), [1, 2]);
assert.deepEqual(pageWindow(1, 8), [1, 2, 'ellipsis', 8]);
assert.deepEqual(pageWindow(4, 8), [1, 'ellipsis', 3, 4, 5, 'ellipsis', 8]);
assert.deepEqual(pageWindow(8, 8), [1, 'ellipsis', 7, 8]);
assert.equal(pageRangeLabel(2, 12, 48), 'Showing 13–24 of 48');
console.log('pagination helper tests passed');
