<script>
	import Background from '../background.svelte';
	import Layout from '../layout.svelte';
</script>

<Background />
<Layout />

<style>
	:global {
		:root {
			--color-neutral: #eee;
		}

		html,
		body,
		div,
		span,
		applet,
		object,
		iframe,
		h1,
		h2,
		h3,
		h4,
		h5,
		h6,
		p,
		blockquote,
		pre,
		a,
		abbr,
		acronym,
		address,
		big,
		cite,
		code,
		del,
		dfn,
		em,
		img,
		ins,
		kbd,
		q,
		s,
		samp,
		small,
		strike,
		strong,
		sub,
		sup,
		tt,
		var,
		b,
		u,
		i,
		center,
		dl,
		dt,
		dd,
		ol,
		ul,
		li,
		hr,
		fieldset,
		form,
		label,
		legend,
		table,
		caption,
		tbody,
		tfoot,
		thead,
		tr,
		th,
		td,
		article,
		aside,
		canvas,
		details,
		embed,
		figure,
		figcaption,
		footer,
		header,
		hgroup,
		menu,
		nav,
		output,
		ruby,
		section,
		summary,
		time,
		mark,
		audio,
		video,
		noscript {
			margin: 0;
			padding: 0;
			border: 0;
			font-size: 100%;
			font: inherit;
			vertical-align: baseline;
		}

		*,
		*:before,
		*:after {
			box-sizing: inherit;
		}

		html {
			box-sizing: border-box;
		}

		main,
		header,
		footer,
		nav,
		aside,
		section,
		blockquote,
		article,
		video,
		canvas,
		object,
		iframe,
		embed,
		textarea,
		figure,
		figcaption,
		hgroup,
		details,
		figure img {
			display: block;
		}

		a,
		img,
		input,
		select,
		button,
		label {
			display: inline-block;
		}

		button {
			display: block;
			padding: 0;
			margin: 0;
		}

		p a {
			display: inline;
		}

		ul,
		ol {
			width: 100%;
		}

		ul,
		ol,
		li {
			list-style: none;
		}

		hr {
			border: none;
		}

		html {
			font-weight: 400;
			font-style: normal;
			font-size: 100%;
			-webkit-text-size-adjust: 100%;
			-ms-text-size-adjust: 100%;
		}

		body {
			text-rendering: optimizeLegibility;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
			line-height: 1;
		}

		blockquote,
		q {
			quotes: none;
		}

		a {
			color: inherit;
			text-decoration: inherit;
		}

		a,
		button,
		[type='button'],
		[type='submit'] {
			cursor: pointer;
		}

		input,
		textarea,
		select,
		button,
		label {
			color: inherit;
			font: inherit;
			letter-spacing: inherit;
			border-radius: 0;
			background-color: transparent;
			border: none;
			outline: none;
			vertical-align: baseline;
			line-height: inherit;
		}

		input,
		select,
		textarea {
			box-shadow: none;
		}

		textarea {
			overflow: auto;
			vertical-align: top;
			resize: vertical;
		}

		input[type='search']::-webkit-search-cancel-button,
		input[type='search']::-webkit-search-decoration,
		input[type='search']::-webkit-search-results-button,
		input[type='search']::-webkit-search-results-decoration {
			-webkit-appearance: none;
			-moz-appearance: none;
		}

		input[type='search'] {
			-webkit-appearance: none;
			-moz-appearance: none;
			-webkit-box-sizing: content-box;
			-moz-box-sizing: content-box;
			box-sizing: content-box;
		}

		legend {
			white-space: normal;
		}

		button {
			text-align: inherit;
		}

		embed,
		iframe,
		object,
		canvas,
		video {
			max-width: 100%;
			outline: none;
			zoom: 1;
		}

		img {
			max-width: 100%;
			width: 100%;
			height: auto;
			-ms-interpolation-mode: bicubic;
		}

		table {
			table-layout: fixed;
			width: 100%;
			border-collapse: collapse;
			border-spacing: 0;
		}

		[hidden] {
			display: none !important;
		}

		[disabled] {
			cursor: default;
		}

		:focus {
			outline: 0;
		}

		@font-face {
			font-family: Dazzed;
			src:
				url(../assets/fonts/Dazzed-Medium.woff2) format('woff2'),
				url(../assets/fonts/Dazzed-Medium.woff) format('woff');
			font-weight: 400;
			font-style: normal;
		}

		html {
			font-size: 1.05em;
		}

		body {
			font-family: Dazzed, Arial, sans-serif;
			-moz-font-feature-settings: 'ss01', 'ss05';
			-webkit-font-feature-settings: 'ss01', 'ss05';
			font-feature-settings:
				'ss01' on,
				'ss05' on;
			font-size: 1rem;
			letter-spacing: -0.001em;
			line-height: 1.2;
			color: var(--color-neutral);
			background-color: var(--color-main);
		}

		body > div {
			height: 100%;
		}

		nav > .a > a,
		nav > a {
			display: block;
			-webkit-user-select: none;
			-moz-user-select: none;
			-ms-user-select: none;
			user-select: none;
		}

		nav.external > .a > a:before,
		nav.external > a:before {
			content: '→';
			display: inline-block;
			margin-right: 0.3em;
		}

		a {
			transition: color 0.2s ease;
		}

		a.active,
		a[aria-current],
		a:hover {
			color: var(--color-special);
		}

		.banner a[aria-current],
		.banner a:hover {
			color: inherit;
		}

		main nav.list a:before {
			content: '→';
			display: inline-block;
			margin-right: 0.3em;
		}

		button {
			cursor: pointer;
		}

		::selection {
			background-color: var(--color-main);
			color: var(--color-special);
		}

		main p {
			hyphens: auto;
			-webkit-hyphens: auto;
			-webkit-hyphenate-limit-before: 3;
			-webkit-hyphenate-limit-after: 3;
		}

		main p + p,
		main p + h2,
		main p + h3,
		main p + ul,
		main p + ol,
		main p + nav,
		main ol + p,
		main ol + h2,
		main ol + h3,
		main ol + ul,
		main ol + ol,
		main ol + nav,
		main ul + p,
		main ul + h2,
		main ul + h3,
		main ul + ul,
		main ul + ol,
		main ul + nav,
		main dl + p,
		main dl + h2,
		main dl + h3,
		main dl + ul,
		main dl + ol,
		main dl + nav {
			margin-top: 1em;
		}

		main li p {
			margin: 0;
		}

		dl dt {
			display: inline-block;
			margin-right: 0.3em;
		}

		dl dt.colon:after {
			content: ':';
		}

		dl dd {
			display: inline;
		}

		.tnum,
		pre {
			font-variant-numeric: tabular-nums;
			-moz-font-feature-settings: 'tnum';
			-webkit-font-feature-settings: 'tnum';
			font-feature-settings: 'tnum';
		}

		pre {
			white-space: pre-wrap;
			white-space: -moz-pre-wrap;
			white-space: -pre-wrap;
			white-space: -o-pre-wrap;
			word-wrap: break-word;
		}

		.text strong,
		.text b {
			color: var(--color-special);
		}

		label,
		input {
			margin: 0;
			padding: 0;
			width: 100%;
			display: block;
			text-align: left;
		}

		input {
			color: var(--color-special);
		}

		input:invalid,
		input::placeholder {
			color: var(--color-main);
		}

		figure.cover img,
		img.cover {
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: center;
		}

		img {
			color: transparent;
		}

		.lazyload,
		.lazyloading {
			opacity: 0;
		}

		.lazyloaded {
			opacity: 1;
			transition: opacity 1s ease;
		}

		#content > main {
			animation: slideIn 0.4s ease;
		}

		.live.spin {
			animation-name: spin;
			animation-duration: 5s;
			animation-iteration-count: infinite;
			animation-timing-function: linear;
		}

		.appear {
			animation-name: appear;
			animation-duration: 0.3s;
			animation-timing-function: ease;
		}

		.pulse {
			animation-timing-function: linear;
			animation-name: pulse;
			animation-duration: 1s;
			animation-iteration-count: infinite;
		}

		@keyframes spin {
			0% {
				transform: translateZ(100px) rotateY(0);
			}

			to {
				transform: translateZ(100px) rotateY(360deg);
			}
		}

		@keyframes pulse {
			0%,
			to {
				opacity: 1;
			}

			50% {
				opacity: 0;
			}
		}

		@keyframes slideIn {
			0% {
				transform: translate(105%);
			}

			to {
				transform: translate(0);
			}
		}

		@keyframes appear {
			0% {
				opacity: 0;
			}

			to {
				opacity: 1;
			}
		}

		.site-background {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			overflow: hidden;
			z-index: 0;
			z-index: -10000000;
		}

		.site-background img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: center;
		}
	}
</style>
