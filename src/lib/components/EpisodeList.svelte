<script>
	let { folders = [], onSelect } = $props();
</script>

<div class="p-4">
	{#if folders.length === 0}
		<p class="text-center text-gray-500 dark:text-gray-400 py-8">No folders found</p>
	{:else}
		<ul class="space-y-2">
			{#each folders as folder}
				<li>
					<button
						onclick={() => onSelect(folder)}
						class="w-full text-left px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
					>
						<div class="flex items-center gap-3">
							<svg class="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
							</svg>
							<span class="truncate">{folder.name}</span>
						</div>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
