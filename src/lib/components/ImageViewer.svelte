<script>
	import { onMount, onDestroy } from 'svelte';
	import { getImageUrl } from '$lib/pcloud.js';

	let { images = [], code, folderId } = $props();

	let imageUrls = $state([]);
	let loadedCount = $state(0);
	let containerRef = $state(null);

	onMount(async () => {
		const savedPosition = localStorage.getItem(`bookmark_${code}_${folderId}`);

		const urls = await Promise.all(
			images.map(async (img) => {
				try {
					return await getImageUrl(code, img.fileid);
				} catch {
					return null;
				}
			})
		);
		imageUrls = urls.filter(Boolean);

		if (savedPosition && containerRef) {
			setTimeout(() => {
				window.scrollTo(0, parseInt(savedPosition, 10));
			}, 100);
		}
	});

	function handleImageLoad() {
		loadedCount++;
	}

	function savePosition() {
		if (folderId) {
			localStorage.setItem(`bookmark_${code}_${folderId}`, window.scrollY.toString());
		}
	}

	onMount(() => {
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
				<p>Loading images...</p>
			</div>
		</div>
	{:else}
		<div class="flex flex-col items-center">
			{#each imageUrls as url, i}
				<img
					src={url}
					alt="Page {i + 1}"
					loading="lazy"
					onload={handleImageLoad}
					class="w-full max-w-3xl"
				/>
			{/each}
		</div>

		{#if loadedCount < imageUrls.length}
			<div class="fixed bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
				{loadedCount} / {imageUrls.length}
			</div>
		{/if}
	{/if}
</div>
