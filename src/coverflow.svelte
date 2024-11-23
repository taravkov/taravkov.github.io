<script>
	import { onMount, tick } from 'svelte';
	import gsap from 'gsap';
	import ScrollTrigger from 'gsap/ScrollTrigger';
	import Draggable from 'gsap/Draggable';

	export let loadCovers; // Функция передается через пропсы

	let covers = Array(50).fill('/record-placeholder.jpg'); // Изначально только плейсхолдеры
	let initialized = false; // Флаг для предотвращения повторной инициализации GSAP

	// Загрузка реальных обложек
	onMount(async () => {
		try {
			if (typeof loadCovers === 'function') {
				const loadedCovers = await loadCovers();
				// Постепенно заменяем плейсхолдеры реальными обложками
				loadedCovers.forEach((cover, index) => {
					covers[index] = cover || '/record-placeholder.jpg';
				});
			} else {
				console.error('`loadCovers` is not a function or was not provided.');
			}
		} catch (error) {
			console.error('Error loading covers:', error);
		}

		// Убедиться, что GSAP инициализирован только один раз
		if (!initialized) {
			await tick(); // Ждем, пока DOM обновится
			initGSAP(); // Инициализация GSAP
		}
	});

	// Инициализация GSAP
	function initGSAP() {
		initialized = true;
		gsap.registerPlugin(ScrollTrigger, Draggable);

		const BOXES = gsap.utils.toArray('.box');

		gsap.set('.box', { yPercent: -50 });

		const STAGGER = 0.1;
		const DURATION = 1;
		const OFFSET = 0;

		const LOOP = gsap.timeline({ paused: true, repeat: -1, ease: 'none' });

		const SHIFTS = [...BOXES, ...BOXES, ...BOXES];

		SHIFTS.forEach((BOX, index) => {
			const BOX_TL = gsap
				.timeline()
				.set(BOX, { xPercent: 250, rotateY: -50, opacity: 0, scale: 0.5 })
				.to(BOX, { opacity: 1, scale: 1, duration: 0.1 }, 0)
				.to(BOX, { opacity: 0, scale: 0.5, duration: 0.1 }, 0.9)
				.fromTo(
					BOX,
					{ xPercent: 250 },
					{ xPercent: -350, duration: 1, immediateRender: false, ease: 'power1.inOut' },
					0
				)
				.fromTo(
					BOX,
					{ rotateY: -50 },
					{ rotateY: 50, immediateRender: false, duration: 1, ease: 'power4.inOut' },
					0
				)
				.to(BOX, { z: 100, scale: 1.25, duration: 0.1, repeat: 1, yoyo: true }, 0.4)
				.fromTo(
					BOX,
					{ zIndex: 1 },
					{
						zIndex: BOXES.length,
						repeat: 1,
						yoyo: true,
						ease: 'none',
						duration: 0.5,
						immediateRender: false
					},
					0
				);

			LOOP.add(BOX_TL, index * STAGGER);
		});

		const CYCLE_DURATION = STAGGER * BOXES.length;
		const START_TIME = CYCLE_DURATION + DURATION * 0.5 + OFFSET;

		const LOOP_HEAD = gsap.fromTo(
			LOOP,
			{ totalTime: START_TIME },
			{ totalTime: `+=${CYCLE_DURATION}`, duration: 1, ease: 'none', repeat: -1, paused: true }
		);

		const PLAYHEAD = { position: 0 };

		const POSITION_WRAP = gsap.utils.wrap(0, LOOP_HEAD.duration());

		const SCRUB = gsap.to(PLAYHEAD, {
			position: 0,
			onUpdate: () => LOOP_HEAD.totalTime(POSITION_WRAP(PLAYHEAD.position)),
			paused: true,
			duration: 0.25,
			ease: 'power3'
		});

		let iteration = 0;
		const TRIGGER = ScrollTrigger.create({
			start: 0,
			end: '+=2000',
			horizontal: true,
			pin: '.boxes',
			scroller: '#coverflow-scroller',
			onUpdate: (self) => {
				const SCROLL = self.scroll();
				if (SCROLL > self.end - 1) WRAP(1, 1);
				else if (SCROLL < 1 && self.direction < 0) WRAP(-1, self.end - 1);
				else {
					const NEW_POS = (iteration + self.progress) * LOOP_HEAD.duration();
					SCRUB.vars.position = NEW_POS;
					SCRUB.invalidate().restart();
				}
			}
		});

		const WRAP = (iterationDelta, scrollTo) => {
			iteration += iterationDelta;
			TRIGGER.scroll(scrollTo);
			TRIGGER.update();
		};

		const SNAP = gsap.utils.snap(1 / BOXES.length);

		const progressToScroll = (progress) =>
			gsap.utils.clamp(1, TRIGGER.end - 1, gsap.utils.wrap(0, 1, progress) * TRIGGER.end);

		const scrollToPosition = (position) => {
			const SNAP_POS = SNAP(position);
			const PROGRESS = (SNAP_POS - LOOP_HEAD.duration() * iteration) / LOOP_HEAD.duration();
			const SCROLL = progressToScroll(PROGRESS);
			if (PROGRESS >= 1 || PROGRESS < 0) return WRAP(Math.floor(PROGRESS), SCROLL);
			TRIGGER.scroll(SCROLL);
		};

		ScrollTrigger.addEventListener('scrollEnd', () => scrollToPosition(SCRUB.vars.position));

		const NEXT = () => scrollToPosition(SCRUB.vars.position - 1 / BOXES.length);
		const PREV = () => scrollToPosition(SCRUB.vars.position + 1 / BOXES.length);

		document.addEventListener('keydown', (event) => {
			if (event.code === 'ArrowLeft' || event.code === 'KeyA') NEXT();
			if (event.code === 'ArrowRight' || event.code === 'KeyD') PREV();
		});

		const boxesContainer = document.querySelector('.boxes');
		if (boxesContainer) {
			boxesContainer.addEventListener('click', (e) => {
				const BOX = e.target.closest('.box');
				if (BOX) {
					let TARGET = BOXES.indexOf(BOX);
					let CURRENT = gsap.utils.wrap(
						0,
						BOXES.length,
						Math.floor(BOXES.length * SCRUB.vars.position)
					);
					let BUMP = TARGET - CURRENT;
					if (TARGET > CURRENT && TARGET - CURRENT > BOXES.length * 0.5)
						BUMP = (BOXES.length - BUMP) * -1;
					if (CURRENT > TARGET && CURRENT - TARGET > BOXES.length * 0.5) BUMP = BOXES.length + BUMP;
					scrollToPosition(SCRUB.vars.position + BUMP * (1 / BOXES.length));
				}
			});
		}

		gsap.set('.box', { display: 'block' });
		gsap.set('button', { z: 200 });

		Draggable.create('.drag-proxy', {
			type: 'x',
			trigger: '.box',
			onPress() {
				this.startOffset = SCRUB.vars.position;
			},
			onDrag() {
				SCRUB.vars.position = this.startOffset + (this.startX - this.x) * 0.001;
				SCRUB.invalidate().restart();
			},
			onDragEnd() {
				scrollToPosition(SCRUB.vars.position);
			}
		});
	}
</script>

<div id="coverflow-scroller" class="body">
	<div class="boxes">
		{#each covers as cover, index}
			<div class="box" style="--src: url({cover})">
				<span>{index + 1}</span>
				<img src={cover} alt="Album cover {index + 1}" />
			</div>
		{/each}
	</div>

	<div class="drag-proxy"></div>
</div>

<style>
	* {
		box-sizing: border-box;
	}

	:root {
		--bg: hsl(0, 0%, 10%);
		--min-size: 200px;
	}

	.body {
		display: block;
		position: relative;
		height: 100%;
		width: calc(100% + 32px);
		margin-left: -16px;
		margin-right: -16px;
		padding: 0;
		overflow-y: scroll;
	}

	.drag-proxy {
		visibility: hidden;
		position: absolute;
	}

	@keyframes action {
		0%,
		25%,
		50%,
		100% {
			transform: translate(0, 0);
		}
		12.5%,
		37.5% {
			transform: translate(0, 25%);
		}
	}

	.boxes {
		height: 100%;
		width: 100%;
		overflow: hidden;
		position: absolute;
		transform-style: preserve-3d;
		perspective: 800px;
		touch-action: none;
	}

	.box {
		transform-style: preserve-3d;
		position: absolute;
		top: 50%;
		left: 50%;
		height: 20vmin;
		width: 20vmin;
		min-height: var(--min-size);
		min-width: var(--min-size);
		display: none;
	}

	.box:after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		height: 100%;
		width: 100%;
		background-image: var(--src);
		background-size: cover;
		transform: translate(-50%, -50%) rotate(180deg) translate(0, -100%) translate(0, -0.5vmin);
		opacity: 0.75;
	}

	.box:before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		height: 100%;
		width: 100%;
		background: linear-gradient(var(--bg) 50%, transparent);
		transform: translate(-50%, -50%) rotate(180deg) translate(0, -100%) translate(0, -0.5vmin)
			scale(1.01);
		z-index: 2;
	}

	.box img {
		position: absolute;
		height: 100%;
		width: 100%;
		top: 0;
		left: 0;
		object-fit: cover;
	}

	.box:nth-of-type(odd) {
		background: hsl(90, 80%, 70%);
	}

	.box:nth-of-type(even) {
		background: hsl(90, 80%, 40%);
	}

	@supports (-webkit-box-reflect: below) {
		.box {
			-webkit-box-reflect: below 0.5vmin linear-gradient(transparent 0 50%, white 100%);
		}

		.box:after,
		.box:before {
			display: none;
		}
	}
</style>
