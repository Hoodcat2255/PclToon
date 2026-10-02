<script>
	import { onMount, tick, untrack } from 'svelte';
	import { fetchImageUrls, getImageUrl } from '$lib/pcloud.js';
	import FastScroller from './FastScroller.svelte';
	import PageFlipper from './PageFlipper.svelte';
	import PageStatus from './PageStatus.svelte';
	import {
		computePosition,
		positionToScroll,
		loadBookmark,
		saveBookmark
	} from '$lib/bookmark.js';

	let {
		images = [],
		code,
		folderId,
		chromeVisible = true,
		mode = 'vertical',
		onTap = null,
		onPageTurn = null,
		onScrub = null,
		onReachEnd = null
	} = $props();

	const RESTORE_TIMEOUT_MS = 15000;
	const SAVE_THROTTLE_MS = 300;

	// The parent re-creates this component per folder ({#key}), so `images` is
	// fixed for the lifetime of an instance.
	// status: 'pending' (resolving URL) | 'ready' (URL set) | 'loaded' | 'error'
	let pages = $state(untrack(() => images).map(() => ({ url: null, status: 'pending', retried: false })));

	/** @type {HTMLElement[]} */
	const pageEls = [];

	// Pending bookmark restore. While set, saving is paused so the initial
	// scrollY of 0 does not overwrite the stored position.
	let restoreTarget = null;
	// Pages up to this index load eagerly so a restore target deep in the
	// episode gets its preceding layout.
	let eagerUntil = $state(-1);
	let lastPosition = null;

	// Read before mounting: children (PageFlipper) mount before this component's
	// onMount runs, so their start page must already be known.
	const saved = untrack(() => {
		const loaded = folderId ? loadBookmark(code, folderId) : null;
		return loaded && loaded.i < images.length ? loaded : null;
	});

	// Layout currently rendered; follows `mode`, carrying the reading position over.
	let layout = $state(untrack(() => mode));
	let pagedIndex = $state(saved?.i ?? 0);
	let pagedStart = $state(saved?.i ?? 0);

	const hasDimensions = (image) => image.width > 0 && image.height > 0;

	function pageBoxes() {
		return pageEls.map((el) => {
			const rect = el.getBoundingClientRect();
			return { top: rect.top + window.scrollY, height: rect.height };
		});
	}

	function hasLayout(i) {
		return hasDimensions(images[i]) || pages[i].status === 'loaded' || pages[i].status === 'error';
	}

	function cancelRestore() {
		restoreTarget = null;
		eagerUntil = -1;
	}

	async function tryRestore({ force = false } = {}) {
		if (!restoreTarget) return;
		if (!force) {
			for (let j = 0; j <= restoreTarget.i; j++) {
				if (!hasLayout(j)) return;
			}
		}
		// Wait for layout, then one frame so SvelteKit's post-navigation scroll
		// reset has already happened.
		await tick();
		await new Promise(requestAnimationFrame);
		if (!restoreTarget) return;
		window.scrollTo(0, positionToScroll(restoreTarget, pageBoxes()[restoreTarget.i]));
		cancelRestore();
		trackPosition();
	}

	function trackPosition() {
		if (restoreTarget || !pageEls[0]?.isConnected) return;
		lastPosition = computePosition(pageBoxes(), window.scrollY);
	}

	function persistPosition() {
		if (layout === 'paged') saveBookmark(code, folderId, { i: pagedIndex, f: 0 });
		else if (!restoreTarget) saveBookmark(code, folderId, lastPosition);
	}

	function updatePosition() {
		trackPosition();
		persistPosition();
	}

	// Slow networks: jump to the best estimate rather than dropping the bookmark.
	let restoreTimeout;
	function armRestoreTimeout() {
		clearTimeout(restoreTimeout);
		restoreTimeout = setTimeout(() => tryRestore({ force: true }), RESTORE_TIMEOUT_MS);
	}

	function switchLayout(next) {
		if (next === layout) return;
		if (next === 'paged') {
			trackPosition();
			pagedStart = pagedIndex = (restoreTarget ?? lastPosition)?.i ?? 0;
			cancelRestore();
		} else {
			restoreTarget = { i: pagedIndex, f: 0 };
			eagerUntil = pagedIndex;
			armRestoreTimeout();
		}
		layout = next;
		if (next === 'vertical') tryRestore();
	}

	$effect(() => {
		const next = mode;
		untrack(() => switchLayout(next));
	});

	function handlePagedIndex(i) {
		pagedIndex = i;
		persistPosition();
	}

	function currentPageLabel() {
		const position = computePosition(pageBoxes(), window.scrollY);
		return position ? `${position.i + 1} / ${images.length}` : '';
	}

	function handleLoad(i) {
		pages[i].status = 'loaded';
		tryRestore();
	}

	async function handleError(i) {
		const page = pages[i];
		// Download links expire; resolve a fresh original once before giving up.
		if (!page.retried) {
			page.retried = true;
			try {
				const url = await getImageUrl(code, images[i].fileid);
				// Drop the <img> first so the browser re-requests even if the URL is unchanged.
				page.url = null;
				await tick();
				page.url = url;
				return;
			} catch (err) {
				console.warn(`Refetch failed for ${images[i].name}:`, err);
			}
		}
		page.status = 'error';
		tryRestore();
	}

	async function retryPage(i) {
		pages[i] = { url: null, status: 'pending', retried: true };
		try {
			pages[i].url = await getImageUrl(code, images[i].fileid);
			pages[i].status = 'ready';
		} catch (err) {
			console.warn(`Retry failed for ${images[i].name}:`, err);
			pages[i].status = 'error';
		}
	}

	onMount(() => {
		const signal = { cancelled: false };
		let saveTimer = null;

		if (layout === 'vertical' && saved && (saved.i > 0 || saved.f > 0)) {
			restoreTarget = saved;
			eagerUntil = saved.i;
		}
		armRestoreTimeout();

		// Vertical pages are capped at max-w-3xl, so size thumbnails to a page;
		// paged mode uses the full screen width.
		const pageWidth = pageEls[0]?.clientWidth ?? window.innerWidth;
		const targetWidth = Math.round(pageWidth * (window.devicePixelRatio || 1));
		fetchImageUrls(images, code, {
			targetWidth,
			startAt: saved?.i ?? 0,
			signal,
			onItem(i, url) {
				if (url) {
					pages[i].url = url;
					pages[i].status = 'ready';
				} else {
					pages[i].status = 'error';
					tryRestore();
				}
			}
		});
		tryRestore();

		// Track the position every frame so it is current at teardown (the DOM is
		// already detached by then); write to storage less often.
		let frame = 0;
		function onScroll() {
			if (!frame) {
				frame = requestAnimationFrame(() => {
					frame = 0;
					trackPosition();
				});
			}
			if (saveTimer) return;
			saveTimer = setTimeout(() => {
				saveTimer = null;
				persistPosition();
			}, SAVE_THROTTLE_MS);
		}
		// Mobile browsers rarely fire beforeunload; persist when the page is
		// hidden or unloaded instead.
		function onVisibility() {
			if (document.visibilityState === 'hidden') updatePosition();
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		document.addEventListener('visibilitychange', onVisibility);
		window.addEventListener('pagehide', updatePosition);
		// The user scrolling by hand takes precedence over a pending restore.
		window.addEventListener('touchstart', cancelRestore, { passive: true });
		window.addEventListener('wheel', cancelRestore, { passive: true });

		return () => {
			signal.cancelled = true;
			clearTimeout(saveTimer);
			clearTimeout(restoreTimeout);
			cancelAnimationFrame(frame);
			persistPosition();
			window.removeEventListener('scroll', onScroll);
			document.removeEventListener('visibilitychange', onVisibility);
			window.removeEventListener('pagehide', updatePosition);
			window.removeEventListener('touchstart', cancelRestore);
			window.removeEventListener('wheel', cancelRestore);
		};
	});
</script>

{#if layout === 'paged'}
	<PageFlipper
		{images}
		{pages}
		startIndex={pagedStart}
		{chromeVisible}
		onIndexChange={handlePagedIndex}
		{onPageTurn}
		{onReachEnd}
		{onTap}
		onImageLoad={handleLoad}
		onImageError={handleError}
		onRetry={retryPage}
	/>
{:else}
	<!-- Bottom padding keeps the last page clear of the reader bar. -->
	<div class="min-h-dvh bg-black pb-(--reader-bar-h)">
		<!-- Tapping the page toggles the header for distraction-free reading; keyboard
		     users get the header back by scrolling up, so no key handler is needed. -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div id="episode-pages" class="flex flex-col items-center" onclick={() => onTap?.()}>
			{#each images as image, i (image.fileid)}
				{@const page = pages[i]}
				<div
					bind:this={pageEls[i]}
					data-page={i}
					class="relative w-full max-w-3xl {page.status === 'loaded' || hasDimensions(image) ? '' : page.status === 'error' ? 'min-h-[30dvh]' : 'min-h-[60dvh]'}"
					style={hasDimensions(image) && page.status !== 'loaded' ? `aspect-ratio: ${image.width} / ${image.height}` : ''}
				>
					{#if page.url && page.status !== 'error'}
						<img
							src={page.url}
							alt="Page {i + 1}"
							width={image.width || undefined}
							height={image.height || undefined}
							loading={i <= eagerUntil ? 'eager' : 'lazy'}
							decoding="async"
							onload={() => handleLoad(i)}
							onerror={() => handleError(i)}
							class="block w-full h-auto"
						/>
					{/if}
					<PageStatus index={i} status={page.status} onRetry={() => retryPage(i)} />
				</div>
			{/each}
		</div>

		<FastScroller
			pageLabel={currentPageLabel}
			onDragStart={() => {
				cancelRestore();
				onScrub?.(true);
			}}
			onDragEnd={() => onScrub?.(false)}
			visible={chromeVisible}
		/>
	</div>
{/if}
