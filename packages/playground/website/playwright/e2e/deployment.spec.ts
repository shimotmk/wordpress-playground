/* eslint-disable no-loop-func */
import path from 'path';
import { test, expect } from '../playground-fixtures.ts';
import { startVersionSwitchingServer as startServer } from '../version-switching-server.ts';

const port = 7999;
const url = `http://localhost:${port}`;

const maxDiffPixels = 4000;

let server: Awaited<ReturnType<typeof startServer>> | null = null;

test.beforeEach(async () => {
	server = await startServer({
		port,
		oldVersionDirectory: path.join(
			__dirname,
			'../../../../../dist/packages/playground/wasm-wordpress-net-old'
		),
		midVersionDirectory: path.join(
			__dirname,
			'../../../../../dist/packages/playground/wasm-wordpress-net-mid'
		),
		newVersionDirectory: path.join(
			__dirname,
			'../../../../../dist/packages/playground/wasm-wordpress-net-new'
		),
	});
	server.switchToOldVersion();
	server.setHttpCacheEnabled(true);
});

test.afterEach(async () => {
	if (server) {
		server.kill();
	}
});

for (const cachingEnabled of [true, false]) {
	test(`When a new website version is deployed, it should be loaded upon a regular page refresh (with HTTP caching ${
		cachingEnabled ? 'enabled' : 'disabled'
	})`, async ({ website, page, wordpress }) => {
		server!.setHttpCacheEnabled(cachingEnabled);

		await page.goto(url);
		await website.waitForNestedIframes();
		await expect(page).toHaveScreenshot('website-old.png', {
			maxDiffPixels,
		});

		server!.switchToNewVersion();
		await page.goto(url);
		await website.waitForNestedIframes();
		await expect(
			website.page.getByLabel('Open Site Manager')
		).toBeVisible();
		await expect(wordpress.locator('body')).toContainText('Edit site');
	});
}

test(
	'When a new website version is deployed while the old version is still loaded, ' +
		'creating a new site should still work.',
	async ({ website, page, wordpress }) => {
		server!.setHttpCacheEnabled(true);
		server!.switchToMidVersion();

		await page.goto(`${url}/?wp=6.5`);
		await website.waitForNestedIframes();

		// Switching to the new app version does not trigger a page reload,
		// but it deletes all the stale assets from the server.
		server!.switchToNewVersion();

		// The non-reloaded tab should still work. The remote.html iframes
		// that are already loaded should continue to work, and the newly
		// loaded remote.html iframes should pull in the latest Playground version.
		const siteManagerHeading = website.page.locator(
			'[class*="_site-manager-site-info"]'
		);
		if (await siteManagerHeading.isHidden({ timeout: 5000 })) {
			await website.page.getByLabel('Open Site Manager').click();
		}
		await expect(siteManagerHeading).toBeVisible();

		await website.page.getByText('Add Playground').click();

		const modal = website.page.locator('.components-modal__frame');
		await modal.getByLabel('PHP version').selectOption('7.4');
		await modal.getByLabel('WordPress version').selectOption('6.5');
		await modal.getByLabel('Language').selectOption('pl_PL');
		await website.page.getByText('Create a temporary Playground').click();

		await website.waitForNestedIframes();

		// Confirm we're looking at the Polish site.
		expect(wordpress.locator('body')).toContainText('Edytuj witrynę');
	}
);

test('offline mode – the app should load even when the server goes offline', async ({
	website,
	wordpress,
	page,
	browserName,
}) => {
	test.skip(
		browserName === 'webkit',
		`Playwright creates ephemeral browser contexts for each test, which causes the ` +
			`test to fail in Safari. Tl;dr Safari only allows OPFS access in regular, non-incognito ` +
			`browser tabs. See https://github.com/microsoft/playwright/issues/18235`
	);
	test.skip(
		browserName === 'firefox',
		`Playground's offline mode doesn't work in Firefox yet. ` +
			`See https://github.com/WordPress/wordpress-playground/issues/1645`
	);

	server!.switchToNewVersion();

	await page.goto(`${url}`);
	await website.waitForNestedIframes();

	await expect(website.page.getByLabel('Open Site Manager')).toBeVisible();
	expect(wordpress.locator('body')).toContainText('Edit site');

	server!.kill();
	await page.reload();
	await website.waitForNestedIframes();

	await expect(website.page.getByLabel('Open Site Manager')).toBeVisible();
	expect(wordpress.locator('body')).toContainText('Edit site');
});
