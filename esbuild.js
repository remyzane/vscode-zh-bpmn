const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	// Build the main extension
	const extensionCtx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});

	// Build the BPMN webview script
	const bpmnCtx = await esbuild.context({
		entryPoints: [
			'src/bpmn/index.ts'
		],
		bundle: true,
		format: 'iife', // IIFE format for browser scripts
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'browser',
		outfile: 'out/bpmn/index.js', // Direct output to the expected location
		outbase: '.',
		logLevel: 'silent',
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
		loader: {
			'.css': 'css', // Extract CSS to separate files
			'.png': 'copy',
			'.jpg': 'copy',
			'.jpeg': 'copy',
			'.gif': 'copy',
			'.svg': 'copy',
			'.woff': 'copy',
			'.woff2': 'copy',
			'.ttf': 'copy',
			'.eot': 'copy'
		}
	});

	if (watch) {
		await Promise.all([
			extensionCtx.watch(),
			bpmnCtx.watch()
		]);
	} else {
		await Promise.all([
			extensionCtx.rebuild(),
			bpmnCtx.rebuild()
		]);
		await Promise.all([
			extensionCtx.dispose(),
			bpmnCtx.dispose()
		]);
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
