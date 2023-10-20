import fs from 'fs';
import { traverse } from 'object-traversal';
import { setProperty } from 'dot-prop';
import type { PackageJson } from 'type-fest';
import path from 'pathe';
import trimExtension from 'trim-extension';
import { cleanPackageJson } from './package-json';

export async function createDistPackage({
	packageJsonFilepath
}: {
	packageJsonFilepath: string;
}) {
	const packageJson = JSON.parse(
		await fs.promises.readFile(packageJsonFilepath, 'utf8')
	) as PackageJson;

	await fs.promises.mkdir('dist', { recursive: true });

	if (packageJson.exports) {
		const srcRelativeFilepaths = new Set<string>();

		if (
			typeof packageJson.exports === 'string' &&
			packageJson.exports.startsWith('./src/')
		) {
			srcRelativeFilepaths.add(packageJson.exports);
			const relativeFilepathWithoutExtension = trimExtension(
				packageJson.exports.replace('./src/', '')
			);

			packageJson.exports = {
				require: {
					types: `./${relativeFilepathWithoutExtension}.d.cts`,
					default: `./${relativeFilepathWithoutExtension}.cjs`
				},
				import: {
					types: `./${relativeFilepathWithoutExtension}.d.mts`,
					default: `./${relativeFilepathWithoutExtension}.mjs`
				}
			};
		} else if (typeof packageJson.exports === 'object') {
			traverse(packageJson.exports, ({ value, meta }) => {
				if (typeof value === 'string' && value.startsWith('./src/')) {
					if (meta.nodePath) {
						srcRelativeFilepaths.add(value);
						setProperty(
							packageJson.exports as {},
							meta.nodePath,
							value.replace('./src/', './')
						);
					}
				}
			});
		}

		for (const srcRelativeFilepath of srcRelativeFilepaths) {
			console.log(srcRelativeFilepath);
		}
	}

	await fs.promises.writeFile(
		'dist/package.json',
		JSON.stringify(cleanPackageJson({ packageJson }), null, '\t')
	);
}
