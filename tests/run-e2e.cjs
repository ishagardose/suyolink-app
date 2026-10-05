const { spawnSync } = require('node:child_process');
// Only test builds use this fake project. Browser tests intercept all its requests.
const env = {
  ...process.env,
  EXPO_PUBLIC_SUPABASE_URL: 'https://suyolink-test.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test-publishable-key',
  PLAYWRIGHT_CHANNEL: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
};
for (const [cli, args] of [
  [require.resolve('expo/bin/cli'), ['export', '--platform', 'web', '--clear']],
  [require.resolve('@playwright/test/cli'), ['test', ...process.argv.slice(2)]],
]) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    env,
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
