<script>
	let { onSubmit } = $props();
	let inputValue = $state('');
	let isLoading = $state(false);
	let error = $state('');

	const canPaste = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;

	async function handleSubmit(e) {
		if (e?.preventDefault) e.preventDefault();
		if (!inputValue.trim()) return;

		isLoading = true;
		error = '';

		try {
			await onSubmit(inputValue.trim());
		} catch (err) {
			error = err.message || 'Failed to load link';
		} finally {
			isLoading = false;
		}
	}

	async function handlePaste() {
		try {
			const text = (await navigator.clipboard.readText()).trim();
			if (!text) return;
			inputValue = text;
			await handleSubmit();
		} catch (err) {
			error = 'Clipboard access was denied. Paste the link manually.';
			console.warn('Clipboard read failed:', err);
		}
	}
</script>

<form onsubmit={handleSubmit} class="w-full max-w-md mx-auto p-4">
	<div class="space-y-4">
		<div>
			<label for="pcloud-link" class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
				pCloud Public Link
			</label>
			<div class="flex gap-2">
				<input
					id="pcloud-link"
					type="text"
					inputmode="url"
					autocapitalize="off"
					autocorrect="off"
					autocomplete="off"
					spellcheck="false"
					enterkeyhint="go"
					bind:value={inputValue}
					placeholder="https://e.pcloud.link/publink/show?code=..."
					class="min-w-0 flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
					disabled={isLoading}
				/>
				{#if canPaste}
					<button
						type="button"
						onclick={handlePaste}
						disabled={isLoading}
						class="flex-shrink-0 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors disabled:opacity-50"
					>
						Paste
					</button>
				{/if}
			</div>
		</div>

		{#if error}
			<div class="flex items-center justify-between text-red-500 text-sm">
				<p>{error}</p>
				<button
					type="button"
					onclick={handleSubmit}
					class="ml-2 px-2 py-2 text-blue-500 hover:text-blue-400 underline flex-shrink-0"
				>
					Retry
				</button>
			</div>
		{/if}

		<button
			type="submit"
			disabled={isLoading || !inputValue.trim()}
			class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
		>
			{#if isLoading}
				<span class="flex items-center justify-center gap-2">
					<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
					</svg>
					Loading...
				</span>
			{:else}
				Open
			{/if}
		</button>
	</div>
</form>
