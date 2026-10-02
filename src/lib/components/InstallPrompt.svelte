<script>
	import { base } from '$app/paths';
	import { install } from '$lib/stores/install.svelte.js';
</script>

{#if install.mode}
	<section aria-label="Install app" class="w-full max-w-md mx-auto mt-8 px-4">
		<div class="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700">
			<img src="{base}/icon-192.png" alt="" class="w-10 h-10 rounded-lg flex-shrink-0" />
			<div class="min-w-0 flex-1 text-sm">
				<p class="font-medium">Add PclToon to your home screen</p>
				{#if install.mode === 'ios'}
					<p class="text-gray-500 dark:text-gray-400">Tap Share, then “Add to Home Screen”.</p>
				{:else if install.mode === 'firefox-android'}
					<p class="text-gray-500 dark:text-gray-400">Open the menu (⋮) and choose Install or “Add to Home screen”.</p>
				{:else}
					<p class="text-gray-500 dark:text-gray-400">Opens full screen, like an app.</p>
				{/if}
			</div>
			{#if install.mode === 'prompt'}
				<button
					type="button"
					onclick={() => install.prompt()}
					class="flex-shrink-0 h-11 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
				>
					Install
				</button>
			{/if}
			<button
				type="button"
				onclick={() => install.dismiss()}
				class="flex-shrink-0 w-11 h-11 -mr-2 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors"
				aria-label="Dismiss install hint"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	</section>
{/if}
