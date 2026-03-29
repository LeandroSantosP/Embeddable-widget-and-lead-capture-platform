const env = require('../config/env');

async function requestJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.GEO_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Geo provider returned ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function enrich(ipAddress) {
  try {
    const data = await requestJson(`http://ip-api.com/json/${encodeURIComponent(ipAddress)}?fields=status,country,regionName,city,lat,lon,timezone`);
    if (data.status !== 'success') throw new Error('ip-api could not locate IP');
    return { provider: 'ip-api.com', country: data.country, region: data.regionName, city: data.city, latitude: data.lat, longitude: data.lon, timezone: data.timezone };
  } catch (_providerError) {
    try {
      const data = await requestJson(`https://ipapi.co/${encodeURIComponent(ipAddress)}/json/`);
      if (data.error) throw new Error('ipapi.co could not locate IP');
      return { provider: 'ipapi.co', country: data.country_name, region: data.region, city: data.city, latitude: data.latitude, longitude: data.longitude, timezone: data.timezone };
    } catch (_fallbackError) {
      return null;
    }
  }
}

module.exports = { enrich };