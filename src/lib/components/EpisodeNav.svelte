<script>
	let { hasPrev = false, hasNext = false, onPrev = null, onNext = null } = $props();
</script>

<div class="flex items-center justify-center gap-4 py-8 px-4">
	<button
		onclick={onPrev}
		disabled={!hasPrev}
		class="flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-colors {hasPrev ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 opacity-40 cursor-not-allowed'}"
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		Prev
	</button>
	<button
		onclick={onNext}
		disabled={!hasNext}
		class="flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-colors {hasNext ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 opacity-40 cursor-not-allowed'}"
	>
		Next
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</button>
</div>
