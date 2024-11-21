<script>
	import Cj from './nick-svg/cj.svelte';
	import Tee from './nick-svg/tee.svelte';
</script>

<div class="container">
	<div class="column left"><div class="logo-container"><div class="logo-grow"></div><div class="logo-wrap"><Cj /></div></div></div>
	<div class="column middle">
		Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
		the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley
		of type and scrambled it to make a type specimen book. It has survived not only five centuries,
		but also the leap into electronic typesetting, remaining essentially unchanged. It was
		popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages,
		and more recently with desktop publishing software like Aldus PageMaker including versions of
		Lorem Ipsum.
	</div>
	<div class="column right"><div class="logo-container"><div class="logo-grow"></div><div class="logo-wrap"><Tee /></div></div></div>
</div>

<style>
    .logo-container {
        display: flex; flex-direction: column; height: 100%
    }
    .logo-grow {
        display: flex; 
        flex-grow: 1;
    }
	.container {
		display: flex;
		flex-wrap: wrap;
	}
    .logo-wrap {
        display: flex;
    }
	.middle {
		background-color: #4e4e4ede;
		height: 100vh;
		overflow-y: auto;
		padding: 16px;
	}
	.left, .right {
        padding-bottom: 16px;
	}

	/* Desktop layout (more than 700px) */
	@media (min-width: 700px) {
		.container {
			flex-direction: row;
		}
		.middle {
			min-width: 200px;
			max-width: 400px;
		}
		.left {
            flex: 2;
            height: 100vh;
        }
        .logo-wrap {
            justify-content: flex-end;
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
	@media (max-width: 699px) {
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
		}
	}
</style>
