<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme.js';

	let { children } = $props();

	onMount(() => {
		theme.init();
	});
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
	<title>PclToon</title>
</svelte:head>

<div class={$theme}>
	{@render children()}
</div>
