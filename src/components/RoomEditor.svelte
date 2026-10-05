<script lang="ts">
	import { Save, X } from '@lucide/svelte';
	import { app } from '../lib/app.svelte.ts';
	import { defaultLayout, floorGrid, makeLayout } from '../lib/planner.ts';
	import type { Layout } from '../lib/types.ts';

	const draft = $derived(app.draft!);
	const base = $derived(makeLayout(draft.layout));
	const seats = $derived(base.seats.map((s) => ({ id: s.id, ...(draft.positions[s.id] ?? s) })));
	const grid = $derived(floorGrid(seats, base.tables));

	const clamp = (v: number, min: number, max: number, fallback: number) => Math.max(min, Math.min(max, Math.round(v) || fallback));

	function setKind(kind: Layout['kind']) {
		draft.layout = kind === 'tables' ? { ...defaultLayout } : { kind, rows: 6, columns: 8 };
		draft.removed = [];
		draft.positions = {};
	}

	function resize() {
		const l = draft.layout;
		if (l.kind === 'tables') {
			l.tableRows = clamp(l.tableRows, 1, 4, 2);
			l.tableColumns = clamp(l.tableColumns, 1, 6, 3);
			l.seatsPerSide = clamp(l.seatsPerSide, 1, 12, 8);
		} else {
			l.rows = clamp(l.rows, 1, 8, 6);
			l.columns = clamp(l.columns / 2, 1, 6, 4) * 2;
		}
		draft.removed = [];
		draft.positions = {};
	}

	function toggle(id: string) {
		draft.removed = draft.removed.includes(id) ? draft.removed.filter((x) => x !== id) : [...draft.removed, id];
	}

	function swap(from: string, to: string) {
		const a = seats.find((s) => s.id === from);
		const b = seats.find((s) => s.id === to);
		if (!a || !b || from === to) return;
		draft.positions = { ...draft.positions, [from]: { x: b.x, y: b.y }, [to]: { x: a.x, y: a.y } };
	}

	const close = () => (app.draft = null);
</script>

<div class="modal-backdrop">
	<form class="modal" onsubmit={(e) => (e.preventDefault(), app.saveDraft())}>
		<div class="modal-title">
			<h2>{draft.id ? '編輯教室' : '新增教室'}</h2>
			<button type="button" onclick={close} aria-label="關閉"><X /></button>
		</div>
		<p>選擇桌型與數量；點選座位可停用／恢復，拖曳可交換座位位置。</p>
		<label>教室名稱<input bind:value={draft.name} required maxlength="30" placeholder="例如：316" /></label>
		<label>課程名稱<input bind:value={draft.course} required maxlength="60" /></label>
		<div class="segmented" role="radiogroup" aria-label="桌型">
			<button type="button" role="radio" aria-checked={draft.layout.kind === 'tables'} class:active={draft.layout.kind === 'tables'} onclick={() => setKind('tables')}>長桌（兩側座位）</button>
			<button type="button" role="radio" aria-checked={draft.layout.kind === 'rows'} class:active={draft.layout.kind === 'rows'} onclick={() => setKind('rows')}>排桌</button>
		</div>
		{#if draft.layout.kind === 'tables'}
			<div class="form-row">
				<label>每排桌數<input type="number" min="1" max="6" bind:value={draft.layout.tableColumns} onchange={resize} /></label>
				<label>桌子排數<input type="number" min="1" max="4" bind:value={draft.layout.tableRows} onchange={resize} /></label>
				<label>單側座位<input type="number" min="1" max="12" bind:value={draft.layout.seatsPerSide} onchange={resize} /></label>
			</div>
		{:else}
			<div class="form-row">
				<label>座位列數<input type="number" min="1" max="8" bind:value={draft.layout.rows} onchange={resize} /></label>
				<label>每列座位數<input type="number" min="2" max="12" step="2" bind:value={draft.layout.columns} onchange={resize} /></label>
			</div>
		{/if}
		<div class="editor-grid" style:grid-template-columns={grid.columns} style:grid-template-rows={grid.rows}>
			{#each base.tables as t (t.id)}
				<div class="table" style:grid-column="{t.x + 1} / span {t.w}" style:grid-row="{t.y + 1} / span {t.h}">{t.id}</div>
			{/each}
			{#each seats as s (s.id)}
				<button
					type="button"
					class="editor-seat"
					class:removed={draft.removed.includes(s.id)}
					draggable="true"
					style:grid-row={s.y + 1}
					style:grid-column={s.x + 1}
					aria-label={`切換 ${s.id} 座位`}
					onclick={() => toggle(s.id)}
					ondragstart={(e) => e.dataTransfer?.setData('text/plain', s.id)}
					ondragover={(e) => e.preventDefault()}
					ondrop={(e) => (e.preventDefault(), swap(e.dataTransfer?.getData('text/plain') ?? '', s.id))}>{s.id}</button
				>
			{/each}
		</div>
		<div class="modal-actions">
			<button type="button" class="secondary" onclick={close}>取消</button>
			<button class="primary" type="submit"><Save />儲存教室</button>
		</div>
	</form>
</div>
