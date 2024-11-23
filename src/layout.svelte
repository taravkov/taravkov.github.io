<script lang="ts">
	import Coverflow from './coverflow.svelte';
	import Cj from './nick-svg/cj.svelte';
	import Tee from './nick-svg/tee.svelte';

	let activeTab = $state('bag');

	const goToTab = (e: MouseEvent, tab: string) => {
		activeTab = tab;
		e.preventDefault();
	};

	const loadCovers = async () => {
		const response = await fetch(
			'https://api.discogs.com/users/cj_tee/collection/folders/0/releases'
		);
		const data = await response.json();
		return data.releases.map((release) => release.basic_information.cover_image);
	};
</script>

<div class="container">
	<div class="column left">
		<div class="logo-container">
			<div class="logo-grow"></div>
			<div class="logo-wrap-left"><Cj /></div>
		</div>
	</div>
	<div class="column middle">
		<div class="header"></div>

		{#if activeTab === 'actuelle'}
			<div class="main fade-in"></div>
		{/if}

		{#if activeTab === 'mixes'}
			<div class="main fade-in"></div>
		{/if}

		{#if activeTab === 'affiche'}
			<div class="main fade-in"></div>
		{/if}

		{#if activeTab === 'bag'}
			<div class="main fade-in"><Coverflow loadCovers={loadCovers} /></div>
		{/if}

		{#if activeTab === 'photos'}
			<div class="main fade-in"></div>
		{/if}

		{#if activeTab === 'about'}
			<div class="main fade-in">
				<p>
					CJ Tee is a digital mastermind. As soon as he discovers the connection between technology,
					science, and music, there is no going back for him: he dedicates his life to the pursuit
					of his art formulae. Always under the radar, he is constantly exploring new sounds without
					genre boundaries, working both as a DJ and engineer, and pushing his synthesizer work to a
					limitless realm.
				</p>
			</div>
		{/if}

		<div class="navigation">
			<div>
				<a
					href="/actuelle"
					onclick={(e) => goToTab(e, 'actuelle')}
					class={activeTab === 'actuelle' ? 'active' : ''}>Actuelle</a
				>
				<a
					href="/mixes"
					onclick={(e) => goToTab(e, 'mixes')}
					class={activeTab === 'mixes' ? 'active' : ''}>Mixes</a
				>
				<a
					href="/affiche"
					onclick={(e) => goToTab(e, 'affiche')}
					class={activeTab === 'affiche' ? 'active' : ''}>Affiche</a
				>
			</div>
			<div style="padding-top: 8px;">
				<a
					href="/bag"
					onclick={(e) => goToTab(e, 'bag')}
					class={activeTab === 'bag' ? 'active' : ''}>My Bag</a
				>
				<a
					href="/photos"
					onclick={(e) => goToTab(e, 'photos')}
					class={activeTab === 'photos' ? 'active' : ''}>Photos</a
				>
				<a
					href="/about"
					onclick={(e) => goToTab(e, 'about')}
					class={activeTab === 'about' ? 'active' : ''}>About</a
				>
			</div>
		</div>
	</div>
	<div class="column right">
		<div class="logo-container">
			<div class="logo-grow"></div>
			<div class="logo-wrap-right"><Tee /></div>
		</div>
	</div>
</div>

<style>
	p {
		transition: all 0.3s ease-in; /* Плавный переход для всех свойств */
	}

	.main {
		display: flex;
		flex-grow: 1;
		color: var(--color-main);
	}
	.logo-container {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.logo-grow {
		display: flex;
		flex-grow: 1;
	}
	.container {
		display: flex;
		flex-wrap: wrap;
	}
	.logo-wrap-left,
	.logo-wrap-right {
		display: flex;
	}
	.middle {
		background-color: #4e4e4ede;
		overflow-y: auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
	}
	.left,
	.right {
		padding-bottom: 16px;
	}
	.navigation {
		display: flex;
		flex-direction: column;
		padding-top: 16px;
	}

	.navigation > div {
		display: flex; /* Включаем флекс для вложенных div */
		flex-direction: row; /* Ссылки в столбик */
	}

	.navigation a {
		text-transform: uppercase;
	}

	.navigation a {
		display: flex; /* Включает flex-контейнер */
		justify-content: center; /* Центрирует текст по горизонтали */
		align-items: center; /* Центрирует текст по вертикали */
		width: 100%; /* Занимает 100% ширины родителя */
		text-decoration: none; /* Убирает подчеркивание */
		padding: 8px; /* Добавляет внутренние отступы (опционально) */
		box-sizing: border-box; /* Учитывает padding в ширине элемента */
	}

	.navigation a.active {
		color: var(--color-special);
	}

	/* Класс анимации */
	.fade-in {
		opacity: 0; /* Сначала элемент невидим */
		transform: translateY(20px); /* Сдвигаем элемент вниз */
		animation: fadeIn 0.5s ease-in forwards; /* Анимация */
	}

	/* Анимация появления */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px); /* Сдвиг вниз */
		}
		to {
			opacity: 1;
			transform: translateY(0); /* Возврат в исходное положение */
		}
	}

	/* Desktop layout (more than 700px) */
	@media (min-width: 944px) {
		.container {
			flex-direction: row;
		}
		.middle {
			min-width: 400px;
			max-width: 400px;
			height: 100vh;
		}
		.left {
			flex: 2;
			height: 100vh;
		}
		.logo-wrap-left {
			justify-content: flex-end;
			padding-left: 16px;
			padding-right: 16px;
		}
		.logo-wrap-right {
			padding-left: 16px;
			padding-right: 16px;
		}
		.middle {
			flex: 1;
		}
		.right {
			flex: 1;
		}
	}
	/* Mobile layout (less than 700px) */
	@media (max-width: 943px) {
		.container {
			flex-direction: column;
		}
		.left {
			order: 1;
		}
		.right {
			order: 2;
		}
		.middle {
			order: 3;
			height: calc(100vh - 224px);
		}
		.logo-wrap-left {
			padding-left: 16px;
			padding-top: 16px;
		}
		.logo-wrap-right {
			padding-left: 16px;
			padding-top: 16px;
		}
	}
</style>
