<script>
	// Overlay for a page slot that has not loaded: a pulsing placeholder while
	// pending, or a failure message with Retry. Renders nothing once loaded.
	let { index, status, onRetry = null } = $props();
</script>

{#if status === 'error'}
	<div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 text-sm">
		<p>Page {index + 1} failed to load</p>
		<button
			type="button"
			onclick={(e) => {
				// Keep the tap from also toggling the header / turning the page.
				e.stopPropagation();
				onRetry?.();
			}}
			class="px-4 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
		>
			Retry
		</button>
	</div>
{:else if status !== 'loaded'}
	<div class="absolute inset-0 flex items-center justify-center text-gray-600 text-sm animate-pulse">
		Page {index + 1}
	</div>
{/if}
