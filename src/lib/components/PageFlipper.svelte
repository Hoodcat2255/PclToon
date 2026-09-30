<script>
	import { onMount } from 'svelte';
	import EpisodeNav from './EpisodeNav.svelte';
	import PageStatus from './PageStatus.svelte';

	// Book-style reader: one page per screen in a horizontal scroll-snap strip,
	// so swiping uses the browser's native momentum. Tap the outer thirds to
	// turn pages, the middle to toggle the header.
	let {
		images = [],
		pages = [],
		startIndex = 0,
		chromeVisible = true,
		hasPrevEpisode = false,
		hasNextEpisode = false,
		onPrevEpisode = null,
		onNextEpisode = null,
		onIndexChange = null,
		onPageTurn = null,
		onTap = null,
		onImageLoad = null,
		onImageError = null,
		onRetry = null
	} = $props();

	const EAGER_RADIUS = 2;
	const TAP_ZONE = 1 / 3;

	let scroller;
	let index = $state(0);
	// Page a programmatic move is heading to. Taps and keys step from here so
	// quick repeats are not lost while a smooth scroll is still running; slider
	// jumps (quiet) do not count as page turns, so the chrome stays up. A swipe
	// (touchmove) or scrollend drops it; taps keep it so rapid taps queue up.
	let pending = null;

	let hasEndSlide = $derived(hasPrevEpisode || hasNextEpisode);
	let slideCount = $derived(images.length + (hasEndSlide ? 1 : 0));

	const base = () => pending?.target ?? index;

	function goTo(target, { behavior = 'smooth', quiet = false } = {}) {
		const clamped = Math.min(Math.max(target, 0), slideCount - 1);
		pending = { target: clamped, quiet };
		scroller.scrollTo({ left: clamped * scroller.clientWidth, behavior });
	}

	function handleScroll() {
		const next = Math.round(scroller.scrollLeft / scroller.clientWidth);
		const quiet = pending?.quiet ?? false;
		if (next === pending?.target) pending = null;
		if (next === index) return;
		index = next;
		onIndexChange?.(Math.min(next, images.length - 1));
		if (!quiet) onPageTurn?.();
	}

	function handleClick(e) {
		if (e.target.closest('button')) return;
		const x = e.clientX / window.innerWidth;
		if (x < TAP_ZONE) goTo(base() - 1);
		else if (x > 1 - TAP_ZONE) goTo(base() + 1);
		else onTap?.();
	}

	function handleKeydown(e) {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
		const moves = {
			ArrowRight: base() + 1,
			PageDown: base() + 1,
			ArrowLeft: base() - 1,
			PageUp: base() - 1,
			Home: 0,
			End: images.length - 1
		};
		if (!(e.key in moves)) return;
		e.preventDefault();
		goTo(moves[e.key]);
	}

	function handleSlider(e) {
		goTo(Number(e.currentTarget.value) - 1, { behavior: 'instant', quiet: true });
	}

	// Keep the current page in view when the screen rotates or resizes.
	function handleResize() {
		scroller.scrollTo({ left: index * scroller.clientWidth, behavior: 'instant' });
	}

	onMount(() => {
		index = Math.min(Math.max(startIndex, 0), Math.max(images.length - 1, 0));
		scroller.scrollTo({ left: index * scroller.clientWidth, behavior: 'instant' });
	});
</script>

<svelte:window onkeydown={handleKeydown} onresize={handleResize} />

<!-- Keyboard navigation is handled on window (handleKeydown), so the tap zones
     need no key handler of their own. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	bind:this={scroller}
	data-testid="page-flipper"
	class="fixed inset-0 z-30 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory overscroll-contain touch-pan-x touch-pinch-zoom bg-black [scrollbar-width:none]"
	onscroll={handleScroll}
	onscrollend={() => (pending = null)}
	ontouchmove={() => (pending = null)}
	onclick={handleClick}
>
	{#each images as image, i (image.fileid)}
		{@const page = pages[i]}
		<div data-page={i} class="relative w-full h-full flex-none snap-center snap-always flex items-center justify-center">
			{#if page.url && page.status !== 'error'}
				<img
					src={page.url}
					alt="Page {i + 1}"
					loading={Math.abs(i - index) <= EAGER_RADIUS ? 'eager' : 'lazy'}
					decoding="async"
					onload={() => onImageLoad?.(i)}
					onerror={() => onImageError?.(i)}
					class="max-w-full max-h-full object-contain"
				/>
			{/if}
			<PageStatus index={i} status={page.status} onRetry={() => onRetry?.(i)} />
		</div>
	{/each}
	{#if hasEndSlide}
		<div data-end class="w-full h-full flex-none snap-center snap-always flex flex-col items-center justify-center text-gray-300">
			<p>End of episode</p>
			<EpisodeNav hasPrev={hasPrevEpisode} hasNext={hasNextEpisode} onPrev={onPrevEpisode} onNext={onNextEpisode} />
		</div>
	{/if}
</div>

{#if chromeVisible && images.length > 0}
	<div class="fixed bottom-0 inset-x-0 z-40 flex items-center gap-3 px-4 py-2 bg-black/80 text-white">
		<input
			type="range"
			aria-label="Page"
			min="1"
			max={images.length}
			value={Math.min(index, images.length - 1) + 1}
			oninput={handleSlider}
			class="flex-1 h-11 accent-blue-500"
		/>
		<span class="w-16 text-right text-sm tabular-nums">{Math.min(index + 1, images.length)} / {images.length}</span>
	</div>
{/if}
