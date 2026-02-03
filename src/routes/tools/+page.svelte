<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref, locales, baseLocale } from '$lib/paraglide/runtime';

	const displayLocale = $derived.by(() => {
		const segments = page.url.pathname.split('/').filter(Boolean);
		if (segments.length > 0 && locales.includes(segments[0] as (typeof locales)[number]))
			return segments[0] as (typeof locales)[number];
		return baseLocale;
	});

	const tools = [
		{
			name: () => m.tools_tool_1_name(),
			description: () => m.tools_tool_1_description(),
			url: 'https://onlinemarkdown.com',
			internal: false
		},
		{
			name: () => m.tools_tool_2_name(),
			description: () => m.tools_tool_2_description(),
			url: 'https://notepadplus.org',
			internal: false
		},
		{
			name: () => m.tools_tool_3_name(),
			description: () => m.tools_tool_3_description(),
			url: 'https://timeutcnow.com',
			internal: false
		},
		{
			name: () => m.tools_tool_4_name(),
			description: () => m.tools_tool_4_description(),
			url: 'https://onlinemarkdown.com/markdown-to-pdf',
			internal: false
		}
	];
</script>

<svelte:head>
	<title>{m.seo_tools_title()}</title>
	<meta name="description" content={m.seo_tools_description()} />
	<meta name="keywords" content={m.seo_tools_keywords()} />
</svelte:head>

<main class="page-content text-base-content/90 px-4 py-8 md:py-10">
	<h1>{m.tools_title()}</h1>
	<p>{m.tools_intro()}</p>
	<p>{m.tools_intro_2()}</p>
	<p>{m.tools_intro_3()}</p>

	<section class="section-block">
		<h2>{m.tools_why_title()}</h2>
		<p>{m.tools_why_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.tools_benefits_title()}</h2>
		<p>{m.tools_benefits_body_1()}</p>
		<p>{m.tools_benefits_body_2()}</p>
	</section>

	<section class="section-block">
		<h2>{m.tools_list_title()}</h2>
		<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each tools as tool}
				<a
					href={tool.internal ? localizeHref(tool.url, { locale: displayLocale }) : tool.url}
					class="card card-compact bg-base-100 border-base-300 hover:border-primary/40 border text-left no-underline shadow-sm transition-all hover:shadow-md"
					target={tool.internal ? undefined : '_blank'}
					rel={tool.internal ? undefined : 'noopener noreferrer'}
				>
					<div class="card-body p-4">
						<h3 class="card-title text-primary text-base">{tool.name()}</h3>
						<p class="text-base-content/80 text-sm">{tool.description()}</p>
						<span class="text-primary mt-2 text-xs">
							→ {tool.internal ? tool.url : tool.url.replace(/^https?:\/\//, '')}
						</span>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<section class="section-block">
		<h2>{m.tools_how_title()}</h2>
		<p>{m.tools_how_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.tools_privacy_title()}</h2>
		<p>{m.tools_privacy_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.tools_more_title()}</h2>
		<p>{m.tools_more_body()}</p>
		<p>{m.tools_more_body_2()}</p>
	</section>
</main>
