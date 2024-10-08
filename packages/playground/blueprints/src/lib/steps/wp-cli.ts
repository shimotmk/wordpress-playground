import { PHPResponse, UniversalPHP } from '@php-wasm/universal';
import { StepHandler } from '.';
import { joinPaths, phpVar } from '@php-wasm/util';
import { FileReference } from '../resources';

export const defaultWpCliPath = '/tmp/wp-cli.phar';
export const defaultWpCliResource: FileReference = {
	resource: 'url',
	/**
	 * Use compression for downloading the wp-cli.phar file.
	 * The official release, hosted at raw.githubusercontent.com, is ~7MB
	 * and the transfer is uncompressed. playground.wordpress.net supports
	 * transfer compression and only transmits ~1.4MB.
	 *
	 * @TODO: minify the wp-cli.phar file. It can be as small as 1MB when all the
	 *        whitespaces and are removed, and even 500KB when libraries
	 *        like the JavaScript parser or Composer are removed.
	 */
	url: 'https://playground.wordpress.net/wp-cli.phar',
};

export const assertWpCli = async (
	playground: UniversalPHP,
	wpCliPath: string = defaultWpCliPath
) => {
	if (!(await playground.fileExists(wpCliPath))) {
		throw new Error(`wp-cli.phar not found at ${wpCliPath}.
			You can enable wp-cli support by adding "wp-cli" to the list of extra libraries in your blueprint as follows:
			{
				"extraLibraries": [ "wp-cli" ]
			}
			Read more about it in the documentation.
			https://wordpress.github.io/wordpress-playground/blueprints/data-format#extra-libraries`);
	}
};

/**
 * @inheritDoc wpCLI
 * @hasRunnableExample
 * @example
 *
 * <code>
 * {
 * 		"step": "wp-cli",
 * 		"command": "wp post create --post_title='Test post' --post_excerpt='Some
 * 		content'"
 * }
 * </code>
 */
export interface WPCLIStep {
	/** The step identifier. */
	step: 'wp-cli';
	/** The WP CLI command to run. */
	command: string | string[];
	/** wp-cli.phar path */
	wpCliPath?: string;
}

/**
 * Runs PHP code using [WP-CLI](https://developer.wordpress.org/cli/commands/).
 */
export const wpCLI: StepHandler<WPCLIStep, Promise<PHPResponse>> = async (
	playground,
	{ command, wpCliPath = defaultWpCliPath }
) => {
	await assertWpCli(playground, wpCliPath);

	let args: string[];
	if (typeof command === 'string') {
		command = command.trim();
		args = splitShellCommand(command);
	} else {
		args = command;
	}

	const cmd = args.shift();
	if (cmd !== 'wp') {
		throw new Error(`The first argument must be "wp".`);
	}

	const documentRoot = await playground.documentRoot;

	await playground.writeFile('/tmp/stdout', '');
	await playground.writeFile('/tmp/stderr', '');
	await playground.writeFile(
		joinPaths(documentRoot, 'run-cli.php'),
		`<?php
		// Set up the environment to emulate a shell script
		// call.

		// Set SHELL_PIPE to 0 to ensure WP-CLI formats
		// the output as ASCII tables.
		// @see https://github.com/wp-cli/wp-cli/issues/1102
		putenv( 'SHELL_PIPE=0' );

		// Set the argv global.
		$GLOBALS['argv'] = array_merge([
		  "/tmp/wp-cli.phar",
		  "--path=${documentRoot}"
		], ${phpVar(args)});

		// Provide stdin, stdout, stderr streams outside of
		// the CLI SAPI.
		define('STDIN', fopen('php://stdin', 'rb'));
		define('STDOUT', fopen('php://stdout', 'wb'));
		define('STDERR', fopen('php://stderr', 'wb'));

		require( ${phpVar(wpCliPath)} );
		`
	);

	const result = await playground.run({
		scriptPath: joinPaths(documentRoot, 'run-cli.php'),
	});

	if (result.errors) {
		throw new Error(result.errors);
	}

	return result;
};

/**
 * Naive shell command parser.
 * Ensures that commands like `wp option set blogname "My blog name"` are split
 * into `['wp', 'option', 'set', 'blogname', 'My blog name']` instead of
 * `['wp', 'option', 'set', 'blogname', 'My', 'blog', 'name']`.
 *
 * @param command
 * @returns
 */
export function splitShellCommand(command: string) {
	const MODE_NORMAL = 0;
	const MODE_IN_QUOTE = 1;

	let mode = MODE_NORMAL;
	let quote = '';

	const parts: string[] = [];
	let currentPart = '';
	for (let i = 0; i < command.length; i++) {
		const char = command[i];
		if (mode === MODE_NORMAL) {
			if (char === '"' || char === "'") {
				mode = MODE_IN_QUOTE;
				quote = char;
			} else if (char.match(/\s/)) {
				if (currentPart) {
					parts.push(currentPart);
				}
				currentPart = '';
			} else {
				currentPart += char;
			}
		} else if (mode === MODE_IN_QUOTE) {
			if (char === '\\') {
				i++;
				currentPart += command[i];
			} else if (char === quote) {
				mode = MODE_NORMAL;
				quote = '';
			} else {
				currentPart += char;
			}
		}
	}
	if (currentPart) {
		parts.push(currentPart);
	}
	return parts;
}
