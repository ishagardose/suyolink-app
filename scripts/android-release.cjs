const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
process.chdir(root);
for (const name of ['.env.local', '.env']) {
  if (fs.existsSync(name)) process.loadEnvFile(name);
}
const releaseDir = path.join(root, '.release');
const signingDir = path.join(releaseDir, 'signing');
const credentialsPath = path.join(signingDir, 'credentials.json');
const keystorePath = path.join(signingDir, 'suyolink-release.jks');
const javaTool = (name) =>
  process.env.JAVA_HOME
    ? path.join(
        process.env.JAVA_HOME,
        'bin',
        name + (process.platform === 'win32' ? '.exe' : ''),
      )
    : name;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error('Command failed: ' + path.basename(command));
  return result;
}

function signing(create = false) {
  if (create && !fs.existsSync(credentialsPath)) {
    if (fs.existsSync(keystorePath))
      throw new Error(
        'Signing key exists without its credentials. Restore the original credentials instead of replacing the key.',
      );
    fs.mkdirSync(signingDir, { recursive: true });
    const password = crypto.randomBytes(32).toString('hex');
    const credentials = {
      keyAlias: 'suyolink-release',
      storePassword: password,
      keyPassword: password,
    };
    fs.writeFileSync(
      credentialsPath,
      JSON.stringify(credentials, null, 2) + '\n',
      { flag: 'wx', mode: 0o600 },
    );
    Object.assign(process.env, {
      SUYOLINK_STORE_PASSWORD: credentials.storePassword,
      SUYOLINK_KEY_PASSWORD: credentials.keyPassword,
    });
    run(javaTool('keytool'), [
      '-genkeypair',
      '-keystore',
      keystorePath,
      '-alias',
      credentials.keyAlias,
      '-keyalg',
      'RSA',
      '-keysize',
      '2048',
      '-validity',
      '10000',
      '-storetype',
      'PKCS12',
      '-storepass:env',
      'SUYOLINK_STORE_PASSWORD',
      '-keypass:env',
      'SUYOLINK_KEY_PASSWORD',
      '-dname',
      'CN=SuyoLink, O=SuyoLink, C=PH',
    ]);
  }
  if (!fs.existsSync(credentialsPath) || !fs.existsSync(keystorePath))
    throw new Error(
      'Release signing is missing. For a first release run npm run android:signing. Otherwise restore your original .release/signing directory.',
    );
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  Object.assign(process.env, {
    SUYOLINK_KEYSTORE_PATH: keystorePath,
    SUYOLINK_KEY_ALIAS: credentials.keyAlias,
    SUYOLINK_STORE_PASSWORD: credentials.storePassword,
    SUYOLINK_KEY_PASSWORD: credentials.keyPassword,
  });
  const certificate = run(
    javaTool('keytool'),
    [
      '-exportcert',
      '-keystore',
      keystorePath,
      '-alias',
      credentials.keyAlias,
      '-storepass:env',
      'SUYOLINK_STORE_PASSWORD',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const cert = new crypto.X509Certificate(certificate.stdout);
  console.log(
    'Android package: ' + require('../app.json').expo.android.package,
  );
  console.log('Signing SHA-1: ' + cert.fingerprint);
  console.log('Signing SHA-256: ' + cert.fingerprint256);
  return cert;
}

function build() {
  process.env.NODE_ENV = 'production';
  for (const name of [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'GOOGLE_MAPS_API_KEY',
  ]) {
    if (!process.env[name])
      throw new Error(
        name + ' must be configured before building the release APK.',
      );
  }
  if (/suyolink-test|your-project/.test(process.env.EXPO_PUBLIC_SUPABASE_URL))
    throw new Error('Use your real Supabase project for a release build.');
  const cert = signing();
  const sdk =
    process.env.ANDROID_HOME ||
    process.env.ANDROID_SDK_ROOT ||
    (process.platform === 'win32'
      ? path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk')
      : '');
  if (!sdk || !fs.existsSync(sdk))
    throw new Error('Configure ANDROID_HOME with your installed Android SDK.');
  process.env.ANDROID_HOME = sdk;
  run(process.execPath, [
    require.resolve('expo/bin/cli'),
    'prebuild',
    '--platform',
    'android',
    '--no-install',
  ]);

  // Native folders are generated and ignored. Reapply signing after each prebuild.
  const gradleFile = path.join(root, 'android', 'app', 'build.gradle');
  let gradle = fs.readFileSync(gradleFile, 'utf8');
  if (!gradle.includes('signingConfigs.create("suyolinkRelease")')) {
    if (!gradle.includes('    buildTypes {'))
      throw new Error(
        'Unexpected Android Gradle layout; signing was not configured.',
      );
    gradle = gradle.replace(
      '    buildTypes {',
      `    signingConfigs.create("suyolinkRelease") {
        storeFile file(System.getenv("SUYOLINK_KEYSTORE_PATH"))
        storePassword System.getenv("SUYOLINK_STORE_PASSWORD")
        keyAlias System.getenv("SUYOLINK_KEY_ALIAS")
        keyPassword System.getenv("SUYOLINK_KEY_PASSWORD")
    }
    buildTypes {`,
    );
  }
  gradle = gradle.replace(
    /(release\s*\{[\s\S]*?signingConfig )signingConfigs\.debug/,
    '$1signingConfigs.suyolinkRelease',
  );
  if (
    !/release\s*\{[\s\S]*?signingConfig signingConfigs\.suyolinkRelease/.test(
      gradle,
    )
  )
    throw new Error('Release signing configuration could not be verified.');
  fs.writeFileSync(gradleFile, gradle);
  fs.writeFileSync(
    path.join(root, 'android', 'local.properties'),
    'sdk.dir=' + sdk.replace(/\\/g, '/') + '\n',
  );
  // Metro can leave old Android resources behind after an asset extension changes.
  const bundleResources = path.join(
    root,
    'android',
    'app',
    'build',
    'generated',
    'res',
    'createBundleReleaseJsAndAssets',
  );
  if (fs.existsSync(bundleResources)) {
    const resolved = fs.realpathSync(bundleResources);
    if (!resolved.startsWith(root + path.sep))
      throw new Error('Generated resource directory is outside the project.');
    fs.rmSync(resolved, { recursive: true, force: true });
  }
  if (process.platform === 'win32')
    run(
      'cmd.exe',
      [
        '/d',
        '/c',
        'gradlew.bat :app:assembleRelease --no-daemon --max-workers=2',
      ],
      { cwd: path.join(root, 'android') },
    );
  else
    run(
      './gradlew',
      [':app:assembleRelease', '--no-daemon', '--max-workers=2'],
      { cwd: path.join(root, 'android') },
    );

  const tools = fs
    .readdirSync(path.join(sdk, 'build-tools'))
    .filter((v) =>
      fs.existsSync(path.join(sdk, 'build-tools', v, 'lib', 'apksigner.jar')),
    )
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .at(-1);
  if (!tools)
    throw new Error('Android SDK build-tools with apksigner are required.');
  const source = path.join(
    root,
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    'release',
    'app-release.apk',
  );
  const verified = run(
    javaTool('java'),
    [
      '-jar',
      path.join(sdk, 'build-tools', tools, 'lib', 'apksigner.jar'),
      'verify',
      '--print-certs',
      source,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' },
  );
  const expected = cert.fingerprint256.replaceAll(':', '').toLowerCase();
  if (!verified.stdout.toLowerCase().includes(expected))
    throw new Error('APK certificate does not match the release signing key.');
  const version = require('../app.json').expo.version;
  const destination = path.join(releaseDir, 'suyolink-' + version + '.apk');
  fs.copyFileSync(source, destination);
  const digest = crypto
    .createHash('sha256')
    .update(fs.readFileSync(destination))
    .digest('hex');
  fs.writeFileSync(
    destination + '.sha256',
    digest + '  ' + path.basename(destination) + '\n',
  );
  console.log('Signed APK: ' + destination);
  console.log('APK SHA-256: ' + digest);
}

try {
  if (process.argv[2] === 'signing') signing(true);
  else if (process.argv[2] === 'build') build();
  else throw new Error('Use npm run android:signing or npm run build:apk.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
