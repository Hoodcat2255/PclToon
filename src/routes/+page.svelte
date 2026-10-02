<script>
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import Header from '$lib/components/Header.svelte';
	import LinkInput from '$lib/components/LinkInput.svelte';
	import EpisodeList from '$lib/components/EpisodeList.svelte';
	import ImageViewer from '$lib/components/ImageViewer.svelte';
	import ReaderBar from '$lib/components/ReaderBar.svelte';
	import { extractCode, fetchPublicLink, classifyContents } from '$lib/pcloud.js';
	import { parseSearch, buildSearch, resolvePath, defaultView } from '$lib/nav.js';
	import { history as recent } from '$lib/stores/history.svelte.js';
	import { readingMode } from '$lib/stores/reading-mode.svelte.js';

	const HEADER_HIDE_OFFSET = 80;
	const SCROLL_DELTA = 8;
	// Distance from the end of an episode at which the bars come back, so the
	// next-episode controls are at hand when the reader finishes.
	const END_REVEAL_OFFSET = 24;

	// Last fetched showpublink response: { code, data }. Read-only, so no deep proxy.
	let root = $state.raw(null);
	// Latest user-initiated open; an older request that resolves later is ignored.
	let openRequest = 0;
	let loadError = $state('');
	let headerHidden = $state(false);
	let readerBarHeight = $state(0);
	// While the fast-scroll handle is dragged, the scrolling it causes must not
	// hide the bars (and with them the handle).
	let scrubbing = false;

	let route = $derived(parseSearch(page.url.searchParams));
	let resolved = $derived(
		root && root.code === route.code ? resolvePath(root.data.metadata, route.path) : null
	);
	let nodes = $derived(resolved?.nodes ?? []);
	let node = $derived(nodes.at(-1) ?? null);
	let parentNode = $derived(nodes.length >= 2 ? nodes.at(-2) : null);
	let content = $derived(classifyContents(node?.contents || []));

	let currentView = $derived.by(() => {
		if (!route.code) return 'input';
		if (!resolved) return 'loading';
		return defaultView(nodes.length === 1, content, route.list);
	});

	let currentTitle = $derived(node?.name ?? 'PclToon');

	// 현재 에피소드의 형제 폴더들 (에피소드 목록에서 이전/다음)
	let siblingFolders = $derived(parentNode ? classifyContents(parentNode.contents || []).folders : []);
	let episodeIndex = $derived(
		node && parentNode ? siblingFolders.findIndex(f => f.folderid === node.folderid) : -1
	);
	let hasPrevEpisode = $derived(episodeIndex > 0);
	let hasNextEpisode = $derived(episodeIndex >= 0 && episodeIndex < siblingFolders.length - 1);
	let showReaderBar = $derived(currentView === 'viewer' && episodeIndex >= 0);

	// Child of the current folder on the last-read path, highlighted in the list.
	let lastReadId = $derived.by(() => {
		const lastPath = route.code ? recent.get(route.code)?.lastPath : null;
		if (!lastPath || lastPath.length <= route.path.length) return null;
		const onPath = route.path.every((id, i) => lastPath[i] === id);
		return onPath ? lastPath[route.path.length] : null;
	});

	function urlFor(target) {
		return `${base}/${buildSearch(target)}`;
	}

	// `fromParent` marks entries pushed from their parent view, so the header
	// back button can pop history only when the previous entry is that parent.
	// Replacing an entry keeps the flag of the entry it replaces.
	function navigate(target, { replace = false, fromParent = false } = {}) {
		return goto(urlFor(target), {
			replaceState: replace,
			state: { fromParent: replace ? !!page.state.fromParent : fromParent }
		});
	}

	// Fetch the tree whenever the URL points at a code we have not loaded yet
	// (direct link, reload, recent-list resume).
	$effect(() => {
		const code = route.code;
		if (route.invalidCode) {
			loadError = 'Invalid pCloud link format';
			navigate({}, { replace: true });
			return;
		}
		if (!code || root?.code === code) return;

		let cancelled = false;
		fetchPublicLink(code)
			.then((data) => {
				if (cancelled) return;
				root = { code, data };
				recent.add(code, data.metadata.name);
			})
			.catch((err) => {
				if (cancelled) return;
				console.warn('Failed to open link:', err);
				loadError = err.message || 'Failed to load link';
				navigate({}, { replace: true });
			});
		return () => {
			cancelled = true;
		};
	});

	// A stale path (folder removed, old resume entry) falls back to the deepest
	// folder that still exists.
	$effect(() => {
		if (resolved && !resolved.valid) {
			navigate({ code: route.code, path: route.path.slice(0, nodes.length - 1) }, { replace: true });
		}
	});

	$effect(() => {
		if (currentView === 'viewer' && resolved?.valid) {
			const { code, path } = route;
			const name = node.name;
			untrack(() => recent.setLast(code, path, name));
		}
	});

	// Hide the header while scrolling down through an episode, show it on scroll up.
	$effect(() => {
		headerHidden = false;
		if (currentView !== 'viewer') return;

		let lastY = window.scrollY;
		function onScroll() {
			const y = window.scrollY;
			if (scrubbing) {
				lastY = y;
				return;
			}
			// Jumps of more than a screen are programmatic (bookmark restore, mode
			// switch), not the reader scrolling; leave the header as it is.
			if (Math.abs(y - lastY) > window.innerHeight) {
				lastY = y;
				return;
			}
			const atEnd = y >= document.documentElement.scrollHeight - window.innerHeight - END_REVEAL_OFFSET;
			if (atEnd && y > lastY) headerHidden = false;
			else if (y > lastY + SCROLL_DELTA && y > HEADER_HIDE_OFFSET) headerHidden = true;
			else if (y < lastY - SCROLL_DELTA) headerHidden = false;
			if (Math.abs(y - lastY) > SCROLL_DELTA) lastY = y;
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	let mode = $derived(route.code ? readingMode.get(route.code) : 'vertical');

	onMount(() => {
		recent.init();
		readingMode.init();
	});

	async function handleLinkSubmit(url) {
		const request = ++openRequest;
		const code = extractCode(url);
		const data = await fetchPublicLink(code);
		if (request !== openRequest) return;
		root = { code, data };
		loadError = '';
		recent.add(code, data.metadata.name);
		recent.requestPersistence();
		await navigate({ code }, { fromParent: true });
	}

	function handleResume(item) {
		openRequest++;
		loadError = '';
		const path = item.lastPath ?? [];
		navigate({ code: item.code, path }, { fromParent: path.length === 0 });
	}

	function handleFolderSelect(folder) {
		navigate({ code: route.code, path: [...route.path, folder.folderid] }, { fromParent: true });
	}

	function handleBack() {
		// A folder with both images and subfolders shows its viewer first; back
		// from there goes to its own folder list.
		if (currentView === 'viewer' && content.folders.length > 0) {
			navigate({ ...route, list: true }, { replace: true });
			return;
		}
		if (page.state.fromParent) {
			window.history.back();
			return;
		}
		// Deep link or resume: step up to the parent in place, without leaving the app.
		const target = route.path.length > 0 ? { code: route.code, path: route.path.slice(0, -1) } : {};
		navigate(target, { replace: true });
	}

	function handleScrub(active) {
		if (active) {
			scrubbing = true;
			return;
		}
		// Scroll events for the last drag step arrive on the next frame; let them
		// pass before the bars react to scrolling again.
		requestAnimationFrame(() => requestAnimationFrame(() => (scrubbing = false)));
	}

	function openEpisode(folder) {
		if (!folder || folder.folderid === node?.folderid) return;
		navigate({ code: route.code, path: [...route.path.slice(0, -1), folder.folderid] }, { replace: true });
	}

	function handleEpisodeNav(direction) {
		if (episodeIndex < 0) return;
		openEpisode(siblingFolders[episodeIndex + direction]);
	}

	function handleKeydown(e) {
		if (currentView === 'input') return;
		if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

		switch (e.key) {
			case 'Escape':
			case 'Backspace':
				e.preventDefault();
				handleBack();
				break;
			// Paged mode handles Home/End itself (PageFlipper).
			case 'Home':
				if (currentView === 'viewer' && mode === 'vertical') {
					e.preventDefault();
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}
				break;
			case 'End':
				if (currentView === 'viewer' && mode === 'vertical') {
					e.preventDefault();
					window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
				}
				break;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="min-h-dvh bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
	style:--reader-bar-h="{showReaderBar ? readerBarHeight : 0}px"
>
	<Header
		title={currentTitle}
		showBack={currentView !== 'input'}
		onBack={handleBack}
		hidden={headerHidden}
		actions={currentView === 'viewer' ? modeToggle : null}
	/>

	{#snippet modeToggle()}
		<button
			onclick={() => readingMode.toggle(route.code)}
			class="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
			aria-label={mode === 'paged' ? 'Switch to scroll mode' : 'Switch to page mode'}
			title={mode === 'paged' ? 'Scroll mode' : 'Page mode'}
		>
			{#if mode === 'paged'}
				<!-- Currently paging left/right: show the book icon. -->
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.5C10.5 5.5 8 5 5 5v13c3 0 5.5.5 7 1.5m0-13c1.5-1 4-1.5 7-1.5v13c-3 0-5.5.5-7 1.5m0-13v13" />
				</svg>
			{:else}
				<!-- Currently scrolling vertically: show the up/down arrows. -->
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7l4-4 4 4M8 17l4 4 4-4M12 3v18" />
				</svg>
			{/if}
		</button>
	{/snippet}

	{#if currentView === 'input'}
		<div class="flex flex-col items-center justify-center min-h-[80dvh]">
			<div class="text-center mb-8 px-4">
				<h2 class="text-2xl font-bold mb-2">PclToon</h2>
				<p class="text-gray-500 dark:text-gray-400">Paste your pCloud public link to start reading</p>
			</div>
			<LinkInput onSubmit={handleLinkSubmit} />

			{#if loadError}
				<p role="alert" class="w-full max-w-md mx-auto px-4 text-sm text-red-500">{loadError}</p>
			{/if}

			{#if recent.items.length > 0}
				<div class="w-full max-w-md mx-auto mt-8 p-4">
					<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
						Saved links <span class="tabular-nums">({recent.items.length})</span>
					</h3>
					<ul class="space-y-2">
						{#each recent.items as item (item.code)}
							<li class="flex items-stretch gap-2">
								<button
									onclick={() => handleResume(item)}
									class="min-w-0 flex-1 text-left px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
								>
									<div class="flex items-center justify-between">
										<span class="truncate">{item.name}</span>
										<span class="text-xs text-gray-400 flex-shrink-0 ml-2">
											{new Date(item.lastAccess).toLocaleDateString()}
										</span>
									</div>
									{#if item.lastName}
										<div class="mt-1 text-xs text-blue-600 dark:text-blue-400 truncate">
											Continue: {item.lastName}
										</div>
									{/if}
								</button>
								<button
									onclick={() => recent.remove(item.code)}
									class="flex-shrink-0 w-11 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 transition-colors"
									aria-label="Remove {item.name} from saved links"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{:else if currentView === 'loading'}
		<div class="flex items-center justify-center min-h-[60dvh] text-gray-500 dark:text-gray-400">
			<svg class="animate-spin h-8 w-8" viewBox="0 0 24 24" aria-label="Loading">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		</div>
	{:else if currentView === 'list'}
		<EpisodeList folders={content.folders} onSelect={handleFolderSelect} {lastReadId} />
	{:else if currentView === 'viewer'}
		{#key `${route.code}/${node.folderid}`}
			<ImageViewer
				images={content.images}
				code={route.code}
				folderId={node.folderid}
				onPrevEpisode={() => handleEpisodeNav(-1)}
				onNextEpisode={() => handleEpisodeNav(1)}
				{hasPrevEpisode}
				{hasNextEpisode}
				chromeVisible={!headerHidden}
				{mode}
				onTap={() => (headerHidden = !headerHidden)}
				onPageTurn={() => (headerHidden = true)}
				onScrub={handleScrub}
			/>
		{/key}
		{#if showReaderBar}
			<ReaderBar
				episodes={siblingFolders}
				index={episodeIndex}
				hidden={headerHidden}
				onSelect={openEpisode}
				bind:barHeight={readerBarHeight}
			/>
		{/if}
	{/if}
</div>
