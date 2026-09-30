<script>
	import ThemeToggle from './ThemeToggle.svelte';

	let { title = 'PclToon', showBack = false, onBack = () => {}, hidden = false, actions = null } = $props();
</script>

<header
	class="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-transform duration-200 {hidden ? '-translate-y-full' : ''}"
>
	<div class="flex items-center justify-between px-4 py-1">
		<div class="flex items-center gap-1 min-w-0">
			{#if showBack}
				<button
					onclick={onBack}
					class="p-3 -ml-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					aria-label="Go back"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
			{/if}
			<h1 class="text-lg font-semibold truncate">{title}</h1>
		</div>
		<div class="flex items-center gap-2 flex-shrink-0">
			{@render actions?.()}
			<ThemeToggle />
		</div>
	</div>
</header>
