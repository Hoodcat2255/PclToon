<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme.svelte.js';

	const THEME_COLORS = { dark: '#111827', light: '#ffffff' };

	let { children } = $props();

	onMount(() => {
		theme.init();
	});
</script>

<svelte:head>
	<title>PclToon</title>
	<meta name="theme-color" content={theme.value === 'dark' ? THEME_COLORS.dark : THEME_COLORS.light} />
</svelte:head>

<div class={theme.value}>
	{@render children()}
</div>
