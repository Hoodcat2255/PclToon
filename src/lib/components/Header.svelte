<script>
	import ThemeToggle from './ThemeToggle.svelte';

	let { title = 'pCloud Comics', showBack = false, onBack = () => {} } = $props();
</script>

<header class="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
	<div class="flex items-center justify-between px-4 py-3">
		<div class="flex items-center gap-3">
			{#if showBack}
				<button
					onclick={onBack}
					class="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					aria-label="Go back"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
			{/if}
			<h1 class="text-lg font-semibold truncate">{title}</h1>
		</div>
		<ThemeToggle />
	</div>
</header>
