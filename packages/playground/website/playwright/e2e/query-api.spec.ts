import { test, expect } from '../playground-fixtures';

// We can't import the WordPress versions directly from the remote package
// because of ESModules vs CommonJS incompatibilities. Let's just import the
// JSON file directly. @ts-ignore
// eslint-disable-next-line @nx/enforce-module-boundaries
import * as MinifiedWordPressVersions from '../../../wordpress-builds/src/wordpress/wp-versions.json';

const LatestSupportedWordPressVersion = Object.keys(
	MinifiedWordPressVersions
).filter((x) => !['nightly', 'beta'].includes(x))[0];

test('should load PHP 8.0 by default', async ({ website, wordpress }) => {
	// Navigate to the website
	await website.goto('./?url=/phpinfo.php');
	await expect(wordpress.locator('h1.p').first()).toContainText(
		'PHP Version 8.0'
	);
});

test('should load WordPress latest by default', async ({
	website,
	wordpress,
}) => {
	await website.goto('./?url=/wp-admin/');

	const expectedBodyClass =
		'branch-' + LatestSupportedWordPressVersion.replace('.', '-');
	await expect(wordpress.locator(`body.${expectedBodyClass}`)).toContainText(
		'Dashboard'
	);
});

test('should load WordPress 6.3 when requested', async ({
	website,
	wordpress,
}) => {
	await website.goto('./?wp=6.3&url=/wp-admin/');
	await expect(wordpress.locator(`body.branch-6-3`)).toContainText(
		'Dashboard'
	);
});

test('should disable networking when requested', async ({
	website,
	wordpress,
}) => {
	await website.goto('./?networking=no&url=/wp-admin/plugin-install.php');
	await expect(wordpress.locator('.notice.error')).toContainText(
		'Network access is an experimental, opt-in feature'
	);
});

test('should enable networking when requested', async ({
	website,
	wordpress,
}) => {
	await website.goto('./?networking=yes&url=/wp-admin/plugin-install.php');
	await expect(wordpress.locator('body')).toContainText('Install Now');
});

test('should enable networking when requested AND the kitchen sink extension bundle is NOT enabled', async ({
	website,
	wordpress,
}) => {
	await website.goto(
		'./?networking=yes&php-extension-bundle=light&url=/wp-admin/plugin-install.php'
	);
	await expect(wordpress.locator('body')).toContainText('Install Now');
});

test('should install the specified plugin', async ({ website, wordpress }) => {
	await website.goto('./?plugin=gutenberg&url=/wp-admin/plugins.php');
	await expect(wordpress.locator('#deactivate-gutenberg')).toContainText(
		'Deactivate'
	);
});

test('should login the user in by default if no login query parameter is provided', async ({
	website,
	wordpress,
}) => {
	await website.goto('./?url=/wp-admin/');
	await expect(wordpress.locator('body')).toContainText('Dashboard');
});

test('should login the user in if the login query parameter is set to yes', async ({
	website,
	wordpress,
}) => {
	await website.goto('./?login=yes&url=/wp-admin/');
	await expect(wordpress.locator('body')).toContainText('Dashboard');
});

test('should not login the user in if the login query parameter is set to no', async ({
	website,
	wordpress,
}) => {
	await website.goto('./?login=no&url=/wp-admin/');
	await expect(wordpress.locator('input[type="submit"]')).toContainText(
		'Log In'
	);
});
