<script>
	import { onMount } from 'svelte';
	import { batchFetchImageUrls } from '$lib/pcloud.js';

	let {
		images = [],
		code,
		folderId,
		onPrevEpisode = null,
		onNextEpisode = null,
		hasPrevEpisode = false,
		hasNextEpisode = false
	} = $props();

	let imageUrls = $state([]);
	let loadedCount = $state(0);
	let fetchProgress = $state(0);
	let fetchTotal = $state(0);
	let containerRef = $state(null);

	function handleImageLoad() {
		loadedCount++;
	}

	function savePosition() {
		if (folderId) {
			try {
				localStorage.setItem(`bookmark_${code}_${folderId}`, window.scrollY.toString());
			} catch {
				// localStorage 용량 초과 시 무시
			}
		}
	}

	onMount(async () => {
		const savedPosition = localStorage.getItem(`bookmark_${code}_${folderId}`);
		fetchTotal = images.length;

		imageUrls = await batchFetchImageUrls(images, code, 5, (loaded, total) => {
			fetchProgress = loaded;
			fetchTotal = total;
		});

		if (savedPosition && containerRef) {
			setTimeout(() => {
				window.scrollTo(0, parseInt(savedPosition, 10));
			}, 100);
		}

		window.addEventListener('beforeunload', savePosition);
		return () => {
			savePosition();
			window.removeEventListener('beforeunload', savePosition);
		};
	});
</script>

<div bind:this={containerRef} class="min-h-screen bg-black">
	{#if imageUrls.length === 0}
		<div class="flex items-center justify-center h-64">
			<div class="text-center text-gray-400">
				<svg class="animate-spin h-8 w-8 mx-auto mb-4" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
				{#if fetchTotal > 0}
					<p>Loading images... {fetchProgress} / {fetchTotal}</p>
				{:else}
					<p>Loading images...</p>
				{/if}
			</div>
		</div>
	{:else}
		<div class="flex flex-col items-center">
			{#each imageUrls as url, i (url)}
				<img
					src={url}
					alt="Page {i + 1}"
					loading="lazy"
					onload={handleImageLoad}
					class="w-full max-w-3xl"
				/>
			{/each}
		</div>

		{#if hasPrevEpisode || hasNextEpisode}
			<div class="flex items-center justify-center gap-4 py-8 px-4">
				<button
					onclick={onPrevEpisode}
					disabled={!hasPrevEpisode}
					class="flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-colors {hasPrevEpisode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 opacity-40 cursor-not-allowed'}"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Prev
				</button>
				<button
					onclick={onNextEpisode}
					disabled={!hasNextEpisode}
					class="flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-colors {hasNextEpisode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 opacity-40 cursor-not-allowed'}"
				>
					Next
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>
		{/if}

		{#if loadedCount < imageUrls.length}
			<div class="fixed bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
				{loadedCount} / {imageUrls.length}
			</div>
		{/if}
	{/if}
</div>
