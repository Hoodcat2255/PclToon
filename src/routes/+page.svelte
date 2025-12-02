<script>
	import Header from '$lib/components/Header.svelte';
	import LinkInput from '$lib/components/LinkInput.svelte';
	import EpisodeList from '$lib/components/EpisodeList.svelte';
	import ImageViewer from '$lib/components/ImageViewer.svelte';
	import { extractCode, fetchPublicLink } from '$lib/pcloud.js';

	let currentView = $state('input');
	let code = $state('');
	let rootData = $state(null);
	let currentFolder = $state(null);
	let folders = $state([]);
	let images = $state([]);
	let breadcrumb = $state([]);

	async function handleLinkSubmit(url) {
		code = extractCode(url);
		const data = await fetchPublicLink(code);
		rootData = data;

		const contents = data.metadata?.contents || [];
		folders = contents.filter(item => item.isfolder).sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
		);
		images = contents.filter(item => !item.isfolder && isImageFile(item.name)).sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
		);

		if (images.length > 0 && folders.length === 0) {
			currentView = 'viewer';
		} else {
			currentView = 'list';
		}
		breadcrumb = [{ name: data.metadata.name, data: data }];
	}

	function handleFolderSelect(folder) {
		const contents = folder.contents || [];
		const f = contents.filter(item => item.isfolder).sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
		);
		const i = contents.filter(item => !item.isfolder && isImageFile(item.name)).sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
		);

		currentFolder = folder;
		folders = f;
		images = i;
		breadcrumb = [...breadcrumb, { name: folder.name, folder: folder }];

		if (i.length > 0) {
			currentView = 'viewer';
		} else if (f.length > 0) {
			currentView = 'list';
		}
	}

	function isImageFile(filename) {
		const ext = filename.split('.').pop()?.toLowerCase();
		return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
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

			folders = contents.filter(item => item.isfolder).sort((a, b) =>
				a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
			);
			images = contents.filter(item => !item.isfolder && isImageFile(item.name)).sort((a, b) =>
				a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
			);
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

	function getCurrentTitle() {
		if (breadcrumb.length === 0) return 'PclToon';
		return breadcrumb[breadcrumb.length - 1].name;
	}
</script>

<div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
	<Header
		title={getCurrentTitle()}
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
		</div>
	{:else if currentView === 'list'}
		<EpisodeList {folders} onSelect={handleFolderSelect} />
	{:else if currentView === 'viewer'}
		<ImageViewer {images} {code} folderId={currentFolder?.folderid} />
	{/if}
</div>
