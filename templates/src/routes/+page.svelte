<script>
	import * as Card from '$lib/components/ui/card';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import { Button } from '$lib/components/ui/button';
</script>

<main class="flex h-screen w-screen">
	<Card.Root class="mx-auto my-auto max-w-md">
		<Card.Header>
			<h1 class="text-sm text-muted-foreground">create-addi-stack</h1>
		</Card.Header>
		<Card.Content
			>You've successfully set up your <code>addi-stack</code> project. For extra documentation on
			using the <code>addi-stack</code>, check the docs below!</Card.Content
		>
		<Card.Footer class="flex flex-col gap-2">
			<ButtonGroup.Root class="w-full">
				<Button class="w-1/2 bg-[#111] p-0 text-[#c5f74f] hover:bg-[#c5f74f] hover:text-[#111]">
					<a
						href="https://orm.drizzle.team/docs"
						class="flex h-full w-full items-center justify-center"
					>
						<svg width="1em" height="1em" fill="none" viewBox="0 0 160 160" class="size-5"
							><rect
								width="9.631"
								height="40.852"
								fill="currentColor"
								rx="4.816"
								transform="matrix(.87303 .48767 -.49721 .86763 43.48 67.304)"
							/><rect
								width="9.631"
								height="40.852"
								fill="currentColor"
								rx="4.816"
								transform="matrix(.87303 .48767 -.49721 .86763 76.94 46.534)"
							/><rect
								width="9.631"
								height="40.852"
								fill="currentColor"
								rx="4.816"
								transform="matrix(.87303 .48767 -.49721 .86763 128.424 46.535)"
							/><rect
								width="9.631"
								height="40.852"
								fill="currentColor"
								rx="4.816"
								transform="matrix(.87303 .48767 -.49721 .86763 94.957 67.304)"
							/>
						</svg>
						<span class="sr-only">Drizzle ORM Docs</span>
					</a>
				</Button>
				<Button class=" w-1/2 bg-black p-0 text-white hover:bg-white hover:text-black">
					<a
						href="https://better-auth.com/docs"
						class="flex h-full w-full flex-row items-center justify-center gap-2"
					>
						<svg
							width="500"
							height="500"
							viewBox="0 0 500 500"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							class="size-5"
						>
							<!-- <rect width="500" height="500" fill="current" /> -->
							<rect x="69" y="121" width="86.9879" height="259" fill="currentColor" />
							<rect x="337.575" y="121" width="92.4247" height="259" fill="currentColor" />
							<rect
								x="427.282"
								y="121"
								width="83.4555"
								height="174.52"
								transform="rotate(90 427.282 121)"
								fill="currentColor"
							/>
							<rect
								x="430"
								y="296.544"
								width="83.4555"
								height="177.238"
								transform="rotate(90 430 296.544)"
								fill="currentColor"
							/>
							<rect
								x="252.762"
								y="204.455"
								width="92.0888"
								height="96.7741"
								transform="rotate(90 252.762 204.455)"
								fill="currentColor"
							/>
							<span class="sr-only">Better Auth Docs</span>
						</svg>
					</a>
				</Button>
			</ButtonGroup.Root>
			<ButtonGroup.Root class="w-full">
				<Button class="w-1/2">
					<a href="https://create.addi.lol/docs">addi-stack Docs</a>
				</Button>
				<Button class="w-1/2">
					<a href="https://github.com/addidotlol/addi-stack">GitHub</a>
				</Button>
			</ButtonGroup.Root>
		</Card.Footer>
	</Card.Root>
</main>
