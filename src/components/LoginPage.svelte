<script lang="ts">
	import { ArrowRight, GraduationCap, ShieldCheck } from '@lucide/svelte';
	import { app, live } from '../lib/app.svelte.ts';
</script>

<section class="login">
	<h1>讓等待，少一點。<span>讓學習，多一點。</span></h1>
	<p>找到你的座位，輕輕一點。<br />助教會知道你在哪裡，讓你的問題不再懸著。</p>
	<div class="login-card">
		<div class="section-kicker">WELCOME TO LABLINK</div>
		<h2>開始今天的 Lab</h2>
		<p>{live ? '使用 Google 帳號登入' : 'ORS 登入預留 · 選擇身份體驗操作流程'}</p>
		<button class="primary" onclick={() => app.login('student')}>
			<GraduationCap />{live ? '使用 Google 帳號登入' : '以學生身份進入'}<ArrowRight />
		</button>
		{#if !live}
			<button class="secondary" onclick={() => app.login('ta')}><ShieldCheck />以助教身份進入<ArrowRight /></button>
			<small>示範資料儲存在此瀏覽器，可於多分頁同步。</small>
		{/if}
	</div>
</section>
