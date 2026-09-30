import { describe, it, expect } from 'vitest';
import { computePosition, positionToScroll, parseBookmark } from './bookmark.js';

const pages = [
	{ top: 50, height: 1000 },
	{ top: 1050, height: 500 },
	{ top: 1550, height: 2000 }
];

describe('computePosition', () => {
	it('finds the page at the viewport top and the fraction into it', () => {
		expect(computePosition(pages, 1300)).toEqual({ i: 1, f: 0.5 });
	});

	it('clamps above the first page to its start', () => {
		expect(computePosition(pages, 0)).toEqual({ i: 0, f: 0 });
	});

	it('clamps past the end to the last page', () => {
		expect(computePosition(pages, 99999)).toEqual({ i: 2, f: 1 });
	});

	it('returns null without pages', () => {
		expect(computePosition([], 10)).toBeNull();
	});

	it('round-trips through positionToScroll', () => {
		const position = computePosition(pages, 2050);
		expect(positionToScroll(position, pages[position.i])).toBe(2050);
	});
});

describe('parseBookmark', () => {
	it('accepts the index/fraction format', () => {
		expect(parseBookmark('{"i":3,"f":0.25}')).toEqual({ i: 3, f: 0.25 });
	});

	it('discards legacy scrollY numbers, malformed JSON and out-of-range values', () => {
		expect(parseBookmark('1234')).toBeNull();
		expect(parseBookmark('{oops')).toBeNull();
		expect(parseBookmark('{"i":-1,"f":0.5}')).toBeNull();
		expect(parseBookmark('{"i":1,"f":2}')).toBeNull();
		expect(parseBookmark(null)).toBeNull();
	});
});
