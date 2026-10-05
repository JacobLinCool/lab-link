<script lang="ts">
	import { ArrowLeft, ArrowRight, ArrowUpRight, Lightbulb } from '@lucide/svelte';

	const tips = [
		{
			topic: 'Git 版本控制',
			title: '每次改動，都有跡可循。',
			desc: 'Git 能記錄程式的修改歷史。完成小功能或修好錯誤，就留下一次 commit，方便比較差異、找回舊版本。',
			detail: '先用 git diff 檢查差異，再用 git add 選取檔案、git commit 記錄。Git 在本機就能使用；GitHub 則可託管與分享儲存庫。',
			example: 'git diff\ngit add main.c\ngit commit -m "修正輸入判斷"',
			links: [{ href: 'https://git-scm.com/book/zh-tw/v2', label: '閱讀繁體中文 Pro Git' }],
		},
		{
			topic: 'C 的標準版本',
			title: '同樣是 C，也有不同版本。',
			desc: 'C 語言有 C90、C99、C11、C17、C23 等標準。不同版本支援的語法與功能不同，網路範例能編譯，不代表課堂環境也能直接使用。',
			detail: '先確認課程指定的標準與編譯器。GCC 可以用 -std 選擇版本；例如指定 C17，並開啟警告，讓編譯器幫你找出可疑的寫法。',
			example: 'gcc -std=c17 -Wall -Wextra main.c -o main',
			links: [{ href: 'https://gcc.gnu.org/onlinedocs/gcc/Standards.html', label: '查看 GCC 支援的 C 標準' }],
		},
		{
			topic: '查閱 C 手冊',
			title: '忘記函式怎麼用？查手冊。',
			desc: '不必背下每個函式。查 C 函式時，先看標頭檔、參數型別與回傳值，再讀錯誤條件和範例。',
			detail: 'Linux 安裝開發手冊後，可用 man 3 printf 查函式。第 3 節是函式庫，第 1 節通常是命令列工具；沒安裝也能查線上版。',
			example: 'man 3 printf\nman 3 scanf\nman 3 malloc',
			links: [{ href: 'https://man7.org/linux/man-pages/man3/printf.3.html', label: '打開 printf 的 Linux 手冊' }],
		},
		{
			topic: 'Colab 與雲端 GPU',
			title: '你的 AI 訂閱，也可能有 GPU 額度。',
			desc: 'Google AI Pro／Ultra 包含 Colab 運算單元（CCUs）。已訂閱的話，可先查看內含額度，用雲端 GPU 嘗試運算。',
			detail: '在 Colab「變更執行階段類型」選擇 GPU。運算會消耗額度，機型依供應狀況而定；內含額度並非無限免費使用。',
			note: '限年滿 18 歲的方案管理員，試用不適用。額度以帳號與官方方案頁為準。',
			links: [
				{ href: 'https://support.google.com/googleone/answer/14534406?hl=zh-Hant', label: 'Pro 權益' },
				{ href: 'https://support.google.com/googleone/answer/16286513?hl=zh-Hant', label: 'Ultra 權益' },
				{ href: 'https://colab.research.google.com/', label: '開啟 Colab' },
			],
		},
		{
			topic: '認識模型評測',
			title: '想比較 AI，先看它考了什麼。',
			desc: 'Benchmark 用一組測試評估模型。Artificial Analysis 整理模型能力、速度與價格，幫你比較不同模型的取捨。',
			detail: '先選你在意的任務：程式、數學或推理，再看測試方法、模型版本與日期。綜合分數高，不代表每項任務都更適合你。',
			note: 'Intelligence Index 以英文、文字任務為主；中文與課堂問題，建議再用自己的例子試試。',
			links: [
				{ href: 'https://artificialanalysis.ai/', label: '探索 Artificial Analysis' },
				{ href: 'https://artificialanalysis.ai/methodology/intelligence-benchmarking', label: '了解評測方法' },
			],
		},
	];

	let index = $state(0);
	const tip = $derived(tips[index]);
	const move = (step: number) => (index = (index + step + tips.length) % tips.length);
</script>

<section class="tip-card" aria-label="等待的空檔，學點新東西">
	<div class="tip-heading"><Lightbulb />等待的空檔，學點新東西<span>{index + 1} / {tips.length}</span></div>
	<div class="tip-content">
		<div class="tip-article" aria-live="polite" aria-atomic="true">
			<h2>{tip.title}</h2>
			<p>{tip.desc}</p>
			<p>{tip.detail}</p>
			{#if tip.example}<pre><code>{tip.example}</code></pre>{/if}
			{#if tip.note}<p class="tip-note">{tip.note}</p>{/if}
			<div class="tip-links">
				{#each tip.links as link (link.href)}
					<a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<ArrowUpRight /></a>
				{/each}
			</div>
		</div>
		<div class="tip-controls">
			<button aria-label="上一則小知識" onclick={() => move(-1)}><ArrowLeft /></button>
			<div>
				{#each tips as item, i (item.topic)}
					<button aria-label={`小知識 ${i + 1}：${item.topic}`} aria-pressed={index === i} class="tip-dot" class:selected={index === i} onclick={() => (index = i)}></button>
				{/each}
			</div>
			<button aria-label="下一則小知識" onclick={() => move(1)}><ArrowRight /></button>
		</div>
	</div>
</section>
