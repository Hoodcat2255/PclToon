import { describe, it, expect } from 'vitest';
import { parseSearch, buildSearch, resolvePath, defaultView } from './nav.js';

const tree = {
	name: 'root',
	folderid: 1,
	contents: [
		{ isfolder: true, folderid: 10, name: 'A', contents: [{ isfolder: true, folderid: 20, name: 'A1', contents: [] }] },
		{ isfolder: false, fileid: 5, name: 'x.jpg' }
	]
};

describe('parseSearch / buildSearch', () => {
	it('round-trips code, path and list flag', () => {
		const search = buildSearch({ code: 'abc123', path: [10, 20], list: true });
		expect(search).toBe('?code=abc123&p=10/20&view=list');
		expect(parseSearch(new URLSearchParams(search))).toEqual({
			code: 'abc123',
			invalidCode: false,
			path: [10, 20],
			list: true
		});
	});

	it('returns empty search without a code', () => {
		expect(buildSearch({})).toBe('');
		expect(parseSearch(new URLSearchParams(''))).toMatchObject({ code: null, invalidCode: false, path: [] });
	});

	it('flags non-alphanumeric codes and drops non-numeric path segments', () => {
		const parsed = parseSearch(new URLSearchParams('code=ab%3Cscript&p=10/x/20'));
		expect(parsed.code).toBeNull();
		expect(parsed.invalidCode).toBe(true);
		expect(parsed.path).toEqual([10, 20]);
	});
});

describe('resolvePath', () => {
	it('walks nested folders', () => {
		const { nodes, valid } = resolvePath(tree, [10, 20]);
		expect(valid).toBe(true);
		expect(nodes.map((n) => n.name)).toEqual(['root', 'A', 'A1']);
	});

	it('stops at the deepest existing folder for a stale path', () => {
		const { nodes, valid } = resolvePath(tree, [10, 99, 20]);
		expect(valid).toBe(false);
		expect(nodes.map((n) => n.name)).toEqual(['root', 'A']);
	});
});

describe('defaultView', () => {
	const both = { folders: [{}], images: [{}] };
	it('matches the original folder/viewer rules', () => {
		expect(defaultView(true, { folders: [], images: [{}] }, false)).toBe('viewer');
		expect(defaultView(true, both, false)).toBe('list');
		expect(defaultView(false, both, false)).toBe('viewer');
		expect(defaultView(false, both, true)).toBe('list');
		expect(defaultView(false, { folders: [], images: [] }, false)).toBe('list');
	});
});
