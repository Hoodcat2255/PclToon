<script>
	// Draggable scroll handle on the right edge for jumping through long
	// episodes. Like the header and bottom bar it shows only while the reader
	// chrome is up (`visible`) or while being dragged, never during ordinary
	// scrolling, and ignores pointer events while hidden so it never blocks taps
	// on the pages.
	let { pageLabel = null, onDragStart = null, onDragEnd = null, visible = false } = $props();

	const HANDLE_HEIGHT = 56;

	let trackEl;
	let progress = $state(0);
	let dragging = $state(false);
	let label = $state('');
	let grabOffset = 0;

	let shown = $derived(visible || dragging);

	const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

	function handleScroll() {
		const max = maxScroll();
		if (max <= 0) return;
		progress = Math.min(Math.max(window.scrollY / max, 0), 1);
	}

	function handlePointerDown(e) {
		dragging = true;
		grabOffset = e.clientY - e.currentTarget.getBoundingClientRect().top;
		e.currentTarget.setPointerCapture(e.pointerId);
		label = pageLabel?.() ?? '';
		onDragStart?.();
	}

	function handlePointerMove(e) {
		if (!dragging) return;
		const track = trackEl.getBoundingClientRect();
		const range = track.height - HANDLE_HEIGHT;
		if (range <= 0) return;
		progress = Math.min(Math.max((e.clientY - grabOffset - track.top) / range, 0), 1);
		window.scrollTo(0, progress * maxScroll());
		label = pageLabel?.() ?? '';
	}

	function handlePointerUp() {
		if (!dragging) return;
		dragging = false;
		onDragEnd?.();
	}
</script>

<svelte:window onscroll={handleScroll} />

<div
	bind:this={trackEl}
	class="fixed right-0 top-16 bottom-[calc(var(--reader-bar-h,0px)+1rem)] w-11 z-40 pointer-events-none transition-opacity duration-200 {shown ? 'opacity-100' : 'opacity-0'}"
>
	<div
		role="scrollbar"
		aria-label="Fast scroll"
		aria-controls="episode-pages"
		aria-orientation="vertical"
		aria-valuenow={Math.round(progress * 100)}
		tabindex="-1"
		data-testid="fast-scroller"
		class="absolute right-0 w-11 flex items-center justify-center touch-none select-none {shown ? 'pointer-events-auto' : ''}"
		style="top: calc({progress} * (100% - {HANDLE_HEIGHT}px)); height: {HANDLE_HEIGHT}px"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
	>
		<div
			class="w-2.5 h-11 rounded-full ring-1 ring-black/30 transition-colors {dragging ? 'bg-blue-500' : 'bg-white/80'}"
		></div>
		{#if dragging && label}
			<div class="absolute right-12 px-3 py-1.5 rounded-lg bg-black/80 text-white text-sm whitespace-nowrap">
				{label}
			</div>
		{/if}
	</div>
</div>
