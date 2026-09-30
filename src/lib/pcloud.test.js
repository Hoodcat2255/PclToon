import { describe, it, expect } from 'vitest';
import { extractCode, thumbSize, classifyContents } from './pcloud.js';

describe('extractCode', () => {
	it('reads the code from share URLs and bare codes', () => {
		expect(extractCode('https://e.pcloud.link/publink/show?code=XZabc123')).toBe('XZabc123');
		expect(extractCode('https://u.pcloud.link/publink/show?code=kZ9&foo=1')).toBe('kZ9');
		expect(extractCode('XZabc123')).toBe('XZabc123');
	});

	it('rejects anything else', () => {
		expect(() => extractCode('not a link!')).toThrow('Invalid pCloud link format');
	});
});

describe('thumbSize', () => {
	it('uses a thumbnail when the original is wider than needed and fits the height limit', () => {
		expect(thumbSize({ width: 3000, height: 2000 }, 1080)).toBe('1080x1024');
	});

	it('rounds the width up to a multiple of 4', () => {
		expect(thumbSize({ width: 3000, height: 1000 }, 1081)).toBe('1084x1024');
	});

	it('keeps the original for tall strips that would exceed 1024px', () => {
		expect(thumbSize({ width: 1600, height: 12000 }, 1080)).toBeNull();
	});

	it('keeps the original when it is not wider than the target', () => {
		expect(thumbSize({ width: 800, height: 1200 }, 1080)).toBeNull();
	});

	it('keeps the original without dimensions or thumbnail support', () => {
		expect(thumbSize({}, 1080)).toBeNull();
		expect(thumbSize({ width: 3000, height: 2000, thumb: false }, 1080)).toBeNull();
	});

	it('caps the width at the API maximum', () => {
		expect(thumbSize({ width: 6000, height: 1000 }, 4000)).toBe('2048x1024');
	});
});

describe('classifyContents', () => {
	it('splits and naturally sorts folders and images', () => {
		const { folders, images } = classifyContents([
			{ isfolder: true, name: 'Ep 10' },
			{ isfolder: true, name: 'Ep 2' },
			{ isfolder: false, name: '10.jpg' },
			{ isfolder: false, name: '2.PNG' },
			{ isfolder: false, name: 'notes.txt' }
		]);
		expect(folders.map((f) => f.name)).toEqual(['Ep 2', 'Ep 10']);
		expect(images.map((f) => f.name)).toEqual(['2.PNG', '10.jpg']);
	});
});
