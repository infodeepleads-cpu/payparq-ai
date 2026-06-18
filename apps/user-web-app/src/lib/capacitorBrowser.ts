import { Browser } from '@capacitor/browser';

const BASE_URL = 'https://www.payparq.com';

function isNativeApp(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor?.isNativePlatform?.()
  );
}

/**
 * Opens a checkout URL. In the Capacitor native app this opens a Chrome Custom Tab
 * (no address bar, Google Pay works). In a regular browser it navigates normally.
 */
export async function openCheckout(relativeUrl: string): Promise<void> {
  if (isNativeApp()) {
    await Browser.open({
      url: `${BASE_URL}${relativeUrl}`,
      presentationStyle: 'fullscreen',
    });
  } else {
    window.location.href = relativeUrl;
  }
}
