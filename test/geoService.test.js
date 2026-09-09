const geoService = require('../src/services/geoService');

describe('geoService fallback chain', () => {
  afterEach(() => jest.restoreAllMocks());

  test('skips external providers for localhost IPs', async () => {
    global.fetch = jest.fn();

    await expect(geoService.enrich('::1')).resolves.toBeNull();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('uses ipapi.co when ip-api.com fails', async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('primary timeout'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ country_name: 'Brazil', region: 'SP', city: 'Sao Paulo' }) });

    const result = await geoService.enrich('203.0.113.10');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).toContain('ip-api.com');
    expect(global.fetch.mock.calls[1][0]).toContain('ipapi.co');
    expect(result.provider).toBe('ipapi.co');
  });

  test('returns null when both providers fail', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('provider unavailable'));
    await expect(geoService.enrich('203.0.113.10')).resolves.toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});