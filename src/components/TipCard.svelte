<script lang="ts">
	import { ArrowRight, ArrowUpRight, Lightbulb } from '@lucide/svelte';

	const tips = [
		{ tag: 'WORK SMARTER', title: ['把環境設定的時間，', '留給你的好點子。'], desc: 'Google Colab 讓你直接在瀏覽器執行 Python，不用安裝，也能與同學一起協作。', link: 'https://colab.research.google.com/', label: '探索 Google Colab' },
		{ tag: 'DEBUGGING 101', title: ['卡住的時候，', '先讓問題變小。'], desc: '試著把程式縮成最小可重現範例。印出變數、確認輸入，答案常常就藏在下一行。', link: 'https://docs.python.org/zh-tw/3/tutorial/', label: '閱讀 Python 指南' },
		{ tag: 'A LITTLE REMINDER', title: ['存檔、深呼吸，', '再往前一步。'], desc: '等待助教時，整理你試過的方法與錯誤訊息，讓下一次討論更有效率。', link: 'https://git-scm.com/book/zh-tw/v2', label: '認識 Git 版本控制' },
	];

	let index = $state(0);
	const tip = $derived(tips[index]);

	$effect(() => {
		const timer = setInterval(() => (index = (index + 1) % tips.length), 18000);
		return () => clearInterval(timer);
	});
</script>

<div class="tip-card">
	<div class="tip-heading"><Lightbulb />等待的空檔，學點新東西<span>{index + 1} / {tips.length}</span></div>
	<div class="tip-content">
		<div class="section-kicker">{tip.tag}</div>
		<h2>{tip.title[0]}<br />{tip.title[1]}</h2>
		<p>{tip.desc}</p>
		<a href={tip.link} target="_blank" rel="noopener noreferrer">{tip.label}<ArrowUpRight /></a>
		<div class="tip-controls">
			<div>
				{#each tips as _, i (i)}
					<button aria-label={`小知識 ${i + 1}`} class="tip-dot" class:selected={index === i} onclick={() => (index = i)}></button>
				{/each}
			</div>
			<button aria-label="下一則小知識" onclick={() => (index = (index + 1) % tips.length)}><ArrowRight /></button>
		</div>
	</div>
</div>
