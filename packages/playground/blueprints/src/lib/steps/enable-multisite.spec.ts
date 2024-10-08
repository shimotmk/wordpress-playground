import { RecommendedPHPVersion } from '@wp-playground/common';
import {
	getSqliteDatabaseModule,
	getWordPressModule,
} from '@wp-playground/wordpress-builds';
import { enableMultisite } from './enable-multisite';
import { bootWordPress } from '@wp-playground/wordpress';
import { loadNodeRuntime } from '@php-wasm/node';
import { readFileSync } from 'fs';
import { join } from 'path';
import { login } from './login';

describe('Blueprint step enableMultisite', () => {
	async function doBootWordPress(options: { absoluteUrl: string }) {
		const requestHandler = await bootWordPress({
			createPhpRuntime: async () =>
				await loadNodeRuntime(RecommendedPHPVersion),
			siteUrl: options.absoluteUrl,
			sapiName: 'cli',

			wordPressZip: await getWordPressModule(),
			sqliteIntegrationPluginZip: await getSqliteDatabaseModule(),
			createFiles: {
				'/tmp/wp-cli.phar': readFileSync(
					join(__dirname, '../../test/wp-cli.phar')
				),
			},
		});
		const php = await requestHandler.getPrimaryPhp();

		return { php, requestHandler };
	}

	[
		{
			absoluteUrl: 'http://playground-domain/scope:987987/',
			scoped: true,
		},
		{
			absoluteUrl: 'http://playground-domain/',
			scoped: false,
		},
	].forEach(({ absoluteUrl, scoped }) => {
		it(`should set the WP_ALLOW_MULTISITE and SUBDOMAIN_INSTALL constants on a ${
			scoped ? 'scoped' : 'scopeless'
		} URL`, async () => {
			const { php, requestHandler } = await doBootWordPress({
				absoluteUrl,
			});
			await enableMultisite(php, {});

			/**
			 * Check if the multisite constants are set.
			 */
			const result = await php.run({
				code: `
				<?php
				echo json_encode([
					'WP_ALLOW_MULTISITE' => defined('WP_ALLOW_MULTISITE'),
					'SUBDOMAIN_INSTALL' => defined('SUBDOMAIN_INSTALL'),
				]);
			`,
			});
			expect(result.json['WP_ALLOW_MULTISITE']).toEqual(true);
			expect(result.json['SUBDOMAIN_INSTALL']).toEqual(false);

			/**
			 * Login and confirm that the site is a multisite by confirming
			 * the admin bar includes the multisite menu.
			 */
			await login(php, {});
			const response = await requestHandler.request({
				url: '/',
			});
			expect(response.httpStatusCode).toEqual(200);
			expect(response.text).toContain('My Sites');
			expect(response.text).toContain('Network Admin');
		});
	});
});
