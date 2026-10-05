<script lang="ts">
	import { BadgeCheck, GraduationCap, ShieldCheck } from '@lucide/svelte';
	import { live } from '../lib/app.svelte.ts';
	import type { User } from '../lib/types.ts';

	let { user }: { user: User } = $props();
	const ta = $derived(user.role === 'ta');
</script>

<div class="profile-card">
	<div class="section-kicker">MY PROFILE</div>
	<div class="profile-top">
		<div class="avatar">{user.name[0]}</div>
		<div>
			<h2>{user.name}</h2>
			<span class="badge">{#if ta}<ShieldCheck />課程助教{:else}<GraduationCap />修課學生{/if}</span>
		</div>
	</div>
	<div class="profile-info">
		<div><span>{ta ? '助教編號' : '學號'}</span><strong>{user.studentId}</strong></div>
		<div><span>學校帳號</span><strong>{user.email}</strong></div>
	</div>
	<div class="verified"><BadgeCheck />{live ? 'Google 帳號已登入' : '示範帳號 · ORS 登入預留'}</div>
</div>
