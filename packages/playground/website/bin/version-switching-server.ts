import { startVersionSwitchingServer } from '../playwright/version-switching-server';

const [, , oldVersionDir, midVersionDir, newVersionDir, port] = process.argv;

if (!oldVersionDir || !newVersionDir || !port) {
	console.error(
		'Usage: node version-switching-server.js <oldVersionDir> <newVersionDir> <port>'
	);
	process.exit(1);
}

const server = await startVersionSwitchingServer({
	oldVersionDirectory: oldVersionDir,
	newVersionDirectory: newVersionDir,
	midVersionDirectory: midVersionDir,
	port: parseInt(port, 10),
});

server.switchToNewVersion();
console.log('Version switching server started');
