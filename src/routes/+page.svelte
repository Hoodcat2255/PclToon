<script>
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import LinkInput from '$lib/components/LinkInput.svelte';
	import EpisodeList from '$lib/components/EpisodeList.svelte';
	import ImageViewer from '$lib/components/ImageViewer.svelte';
	import { extractCode, fetchPublicLink, classifyContents } from '$lib/pcloud.js';
	import { history } from '$lib/stores/history.svelte.js';

	let currentView = $state('input');
	let code = $state('');
	let rootData = $state(null);
	let currentFolder = $state(null);
	let folders = $state([]);
	let images = $state([]);
	let breadcrumb = $state([]);

	let currentTitle = $derived(
		breadcrumb.length === 0 ? 'PclToon' : breadcrumb[breadcrumb.length - 1].name
	);

	// 현재 에피소드의 형제 폴더들 (에피소드 목록에서 이전/다음)
	let siblingFolders = $derived.by(() => {
		if (breadcrumb.length < 2) return [];
		const parent = breadcrumb[breadcrumb.length - 2];
		let parentContents;
		if (parent.data) {
			parentContents = parent.data.metadata?.contents || [];
		} else if (parent.folder) {
			parentContents = parent.folder.contents || [];
		} else {
			return [];
		}
		return parentContents
			.filter(item => item.isfolder)
			.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
	});

	let hasPrevEpisode = $derived.by(() => {
		if (!currentFolder || siblingFolders.length === 0) return false;
		const idx = siblingFolders.findIndex(f => f.folderid === currentFolder.folderid);
		return idx > 0;
	});

	let hasNextEpisode = $derived.by(() => {
		if (!currentFolder || siblingFolders.length === 0) return false;
		const idx = siblingFolders.findIndex(f => f.folderid === currentFolder.folderid);
		return idx >= 0 && idx < siblingFolders.length - 1;
	});

	async function handleLinkSubmit(url) {
		code = extractCode(url);
		const data = await fetchPublicLink(code);
		rootData = data;

		const contents = data.metadata?.contents || [];
		({ folders, images } = classifyContents(contents));

		if (images.length > 0 && folders.length === 0) {
			currentView = 'viewer';
		} else {
			currentView = 'list';
		}
		breadcrumb = [{ name: data.metadata.name, data: data }];
		history.add(code, data.metadata.name);
	}

	onMount(() => {
		history.init();
	});

	function handleFolderSelect(folder) {
		const contents = folder.contents || [];
		const classified = classifyContents(contents);

		currentFolder = folder;
		folders = classified.folders;
		images = classified.images;
		breadcrumb = [...breadcrumb, { name: folder.name, folder: folder }];

		if (classified.images.length > 0) {
			currentView = 'viewer';
		} else if (classified.folders.length > 0) {
			currentView = 'list';
		}
	}

	function handleBack() {
		if (currentView === 'viewer' && folders.length > 0) {
			currentView = 'list';
			return;
		}

		if (breadcrumb.length > 1) {
			breadcrumb = breadcrumb.slice(0, -1);
			const prev = breadcrumb[breadcrumb.length - 1];

			let contents;
			if (prev.data) {
				contents = prev.data.metadata?.contents || [];
			} else if (prev.folder) {
				contents = prev.folder.contents || [];
			} else {
				contents = [];
			}

			({ folders, images } = classifyContents(contents));
			currentFolder = prev.folder || null;

			if (images.length > 0 && folders.length === 0) {
				currentView = 'viewer';
			} else {
				currentView = 'list';
			}
		} else {
			currentView = 'input';
			code = '';
			rootData = null;
			currentFolder = null;
			folders = [];
			images = [];
			breadcrumb = [];
		}
	}

	function handleEpisodeNav(direction) {
		if (!currentFolder || siblingFolders.length === 0) return;
		const currentIndex = siblingFolders.findIndex(f => f.folderid === currentFolder.folderid);
		if (currentIndex === -1) return;

		const nextIndex = currentIndex + direction;
		if (nextIndex < 0 || nextIndex >= siblingFolders.length) return;

		const nextFolder = siblingFolders[nextIndex];
		breadcrumb = breadcrumb.slice(0, -1);
		handleFolderSelect(nextFolder);
		window.scrollTo(0, 0);
	}

	function handleKeydown(e) {
		if (currentView === 'input') return;
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

		switch (e.key) {
			case 'Escape':
			case 'Backspace':
				e.preventDefault();
				handleBack();
				break;
			case 'Home':
				if (currentView === 'viewer') {
					e.preventDefault();
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}
				break;
			case 'End':
				if (currentView === 'viewer') {
					e.preventDefault();
					window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
				}
				break;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
	<Header
		title={currentTitle}
		showBack={currentView !== 'input'}
		onBack={handleBack}
	/>

	{#if currentView === 'input'}
		<div class="flex flex-col items-center justify-center min-h-[80vh]">
			<div class="text-center mb-8">
				<h2 class="text-2xl font-bold mb-2">PclToon</h2>
				<p class="text-gray-500 dark:text-gray-400">Paste your pCloud public link to start reading</p>
			</div>
			<LinkInput onSubmit={handleLinkSubmit} />

			{#if history.items.length > 0}
				<div class="w-full max-w-md mx-auto mt-8 p-4">
					<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recent</h3>
					<ul class="space-y-2">
						{#each history.items as item (item.code)}
							<li>
								<button
									onclick={() => handleLinkSubmit(item.code)}
									class="w-full text-left px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
								>
									<div class="flex items-center justify-between">
										<span class="truncate">{item.name}</span>
										<span class="text-xs text-gray-400 flex-shrink-0 ml-2">
											{new Date(item.lastAccess).toLocaleDateString()}
										</span>
									</div>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{:else if currentView === 'list'}
		<EpisodeList {folders} onSelect={handleFolderSelect} />
	{:else if currentView === 'viewer'}
		<ImageViewer
			{images}
			{code}
			folderId={currentFolder?.folderid}
			onPrevEpisode={siblingFolders.length > 0 ? () => handleEpisodeNav(-1) : null}
			onNextEpisode={siblingFolders.length > 0 ? () => handleEpisodeNav(1) : null}
			{hasPrevEpisode}
			{hasNextEpisode}
		/>
	{/if}
</div>
