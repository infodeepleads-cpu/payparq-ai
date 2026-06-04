/**
 * IndexNow utility for submitting URLs to Microsoft Bing's IndexNow service
 * https://www.indexnow.org/
 */

const INDEXNOW_API_URL = 'https://api.indexnow.microsoft.com/indexnow';

export interface IndexNowConfig {
  apiKey: string;
  host: string;
  siteUrl: string;
}

export async function submitUrlsToIndexNow(
  urls: string[],
  config: IndexNowConfig
): Promise<{ success: boolean; submitted: number; error?: string }> {
  try {
    if (!config.apiKey) {
      return {
        success: false,
        submitted: 0,
        error: 'IndexNow API key not configured',
      };
    }

    if (urls.length === 0) {
      return {
        success: false,
        submitted: 0,
        error: 'No URLs to submit',
      };
    }

    // Limit to 10000 URLs per request (IndexNow limit)
    const urlsToSubmit = urls.slice(0, 10000);

    const payload = {
      host: config.host,
      key: config.apiKey,
      keyLocation: `${config.siteUrl}/indexnow-key.txt`,
      urlList: urlsToSubmit,
    };

    const response = await fetch(INDEXNOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('IndexNow API error:', response.status, errorText);
      return {
        success: false,
        submitted: 0,
        error: `IndexNow API returned status ${response.status}`,
      };
    }

    return {
      success: true,
      submitted: urlsToSubmit.length,
    };
  } catch (error) {
    console.error('IndexNow submission error:', error);
    return {
      success: false,
      submitted: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all URLs that should be indexed
 */
export function getIndexableUrls(siteUrl: string, cityData: Record<string, any>) {
  const baseUrl = siteUrl.replace(/\/$/, '');

  const staticPages = [
    '/about',
    '/product',
    '/parking',
    '/security',
    '/contact',
    '/careers',
    '/privacy',
    '/terms',
    '/locations',
  ];

  const airportPages = [
    '/zagreb-airport',
    '/split-airport',
    '/zadar-airport',
    '/dubrovnik-airport',
  ];

  const cityPages = Object.keys(cityData).map(slug => `/city/${slug}`);

  return [
    baseUrl,
    ...staticPages.map(path => `${baseUrl}${path}`),
    ...airportPages.map(path => `${baseUrl}${path}`),
    ...cityPages.map(path => `${baseUrl}${path}`),
  ];
}
