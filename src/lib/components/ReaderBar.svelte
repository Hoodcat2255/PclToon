<script>
	// Bottom bar of the viewer: previous / next episode and a picker to jump to
	// any episode. It slides in and out together with the header.
	let {
		episodes = [],
		index = -1,
		hidden = false,
		onSelect = null,
		barHeight = $bindable(0)
	} = $props();

	let hasPrev = $derived(index > 0);
	let hasNext = $derived(index >= 0 && index < episodes.length - 1);

	const buttonClass =
		'flex-shrink-0 flex items-center gap-1 h-11 px-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none';
</script>

<nav
	aria-label="Episode navigation"
	bind:clientHeight={barHeight}
	inert={hidden}
	class="fixed bottom-0 inset-x-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 pb-[env(safe-area-inset-bottom)] transition-transform duration-200 {hidden ? 'translate-y-full' : ''}"
>
	<div class="flex items-center gap-2 max-w-3xl mx-auto px-2 py-1">
		<button
			type="button"
			disabled={!hasPrev}
			onclick={() => onSelect?.(episodes[index - 1])}
			class={buttonClass}
			aria-label="Previous episode"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			<span class="text-sm">Prev</span>
		</button>
		<select
			aria-label="Episode"
			value={episodes[index]?.folderid}
			onchange={(e) => {
				const next = episodes.find((ep) => String(ep.folderid) === e.currentTarget.value);
				if (next) onSelect?.(next);
			}}
			class="min-w-0 flex-1 h-11 px-3 rounded-lg text-sm text-center truncate bg-gray-100 dark:bg-gray-800 border-0"
		>
			{#each episodes as episode, i (episode.folderid)}
				<option value={episode.folderid}>{episode.name} ({i + 1}/{episodes.length})</option>
			{/each}
		</select>
		<button
			type="button"
			disabled={!hasNext}
			onclick={() => onSelect?.(episodes[index + 1])}
			class={buttonClass}
			aria-label="Next episode"
		>
			<span class="text-sm">Next</span>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	</div>
</nav>
