import assert from 'node:assert/strict';
import { isFemaleGender, isMaleGender, isPlaceholderPhoto, normalizeGender } from './gender.ts';

assert.equal(normalizeGender('2'), 'female');
assert.equal(normalizeGender(2), 'female');
assert.equal(normalizeGender('Female'), 'female');
assert.equal(normalizeGender('f'), 'female');
assert.equal(normalizeGender('1'), 'male');
assert.equal(normalizeGender('M'), 'male');
assert.equal(normalizeGender('male'), 'male');
assert.equal(normalizeGender(''), '');
assert.ok(isFemaleGender('2'));
assert.ok(isMaleGender('1'));
assert.ok(isPlaceholderPhoto(''));
assert.ok(isPlaceholderPhoto('/assets/img/avatar-place.png'));
assert.ok(isPlaceholderPhoto('/assets/img/female-avatar-place.png'));
assert.ok(!isPlaceholderPhoto('/uploads/all/doctor-12.webp'));
console.log('gender helper tests passed');
