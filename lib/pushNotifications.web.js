export async function registerPush() {
  throw new Error(
    'Device push notifications are available in the Android and iOS app.',
  );
}
export async function unregisterPush() {}
export function observePush() {
  return () => {};
}
