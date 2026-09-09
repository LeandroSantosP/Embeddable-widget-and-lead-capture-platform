const env = require('../config/env');
const net = require('node:net');

function isLocalOrPrivateIp(ipAddress) {
  const normalizedIp = ipAddress.replace(/^::ffff:/, '');
  const version = net.isIP(normalizedIp);
  if (version === 6) return normalizedIp === '::1' || normalizedIp.toLowerCase().startsWith('fc') || normalizedIp.toLowerCase().startsWith('fd') || normalizedIp.toLowerCase().startsWith('fe8') || normalizedIp.toLowerCase().startsWith('fe9') || normalizedIp.toLowerCase().startsWith('fea') || normalizedIp.toLowerCase().startsWith('feb');
  if (version !== 4) return true;
  const octets = normalizedIp.split('.').map(Number);
  return octets[0] === 10 || octets[0] === 127 || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168);
}

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
  if (isLocalOrPrivateIp(ipAddress)) return null;

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