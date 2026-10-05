<script lang="ts">
	import { CircleHelp } from '@lucide/svelte';
	import { app } from './lib/app.svelte.ts';
	import Header from './components/Header.svelte';
	import LoginPage from './components/LoginPage.svelte';
	import RoomsPage from './components/RoomsPage.svelte';
	import MapPage from './components/MapPage.svelte';
	import HistoryPage from './components/HistoryPage.svelte';
	import RoomEditor from './components/RoomEditor.svelte';

	$effect(() => app.start());
</script>

<div class="app-shell">
	<div class="workspace">
		<Header />
		<main>
			{#if !app.user}
				<LoginPage />
			{:else if !app.room}
				<RoomsPage />
			{:else if app.view === 'history'}
				<HistoryPage room={app.room} />
			{:else}
				<MapPage room={app.room} user={app.user} />
			{/if}
		</main>
		<footer>
			<span>LabLink · 讓每個問題，都被好好看見。</span>
			<span><CircleHelp />需要協助？現場找助教</span>
		</footer>
	</div>
</div>
<div id="toast" class:visible={app.toastVisible} role="status">{app.toastMessage}</div>
{#if app.draft}
	<RoomEditor />
{/if}
