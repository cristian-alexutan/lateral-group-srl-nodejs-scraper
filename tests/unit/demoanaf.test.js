import { jest } from '@jest/globals';

const mockFetch = jest.fn();
jest.unstable_mockModule('node-fetch', () => ({ default: mockFetch }));

const { searchCompany, getCompanyFromANAFWithFallback } = await import('../../src/anaf.js');

function mockAnafSearch(data) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data }),
  });
}

function mockAnafCompanyError() {
  mockFetch.mockResolvedValue({
    ok: false,
    status: 404,
  });
}

function mockAnafCompanySuccess(data) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data }),
  });
}

describe('ANAF Module', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test('searchCompany returns array with cui and name', async () => {
    mockAnafSearch([{ cui: 23067611, name: 'LATERAL SRL' }]);

    const results = await searchCompany('Lateral');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0]).toHaveProperty('cui', 23067611);
    expect(results[0]).toHaveProperty('name', 'LATERAL SRL');
  });

  test('searchCompany returns empty array for non-existent brand', async () => {
    mockAnafSearch([]);

    const results = await searchCompany('NonExistentBrandXYZ123');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  test('searchCompany throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(searchCompany('Lateral')).rejects.toThrow('ANAF search error: 500');
  });

  test('getCompanyFromANAFWithFallback returns cached data when ANAF fails', async () => {
    mockAnafCompanyError();

    const cachedData = { cui: 23067611, name: 'LATERAL SRL' };
    const result = await getCompanyFromANAFWithFallback('0000000', cachedData);
    expect(result).not.toBeNull();
    expect(result.cui).toBe(23067611);
    expect(result.name).toBe('LATERAL SRL');
  });

  test('getCompanyFromANAFWithFallback throws when no cache and ANAF fails', async () => {
    const errMsg = 'ANAF API error: 404';
    mockAnafCompanyError();

    await expect(getCompanyFromANAFWithFallback('0000000')).rejects.toThrow(errMsg);
  });

  test('getCompanyFromANAFWithFallback returns live data when ANAF succeeds', async () => {
    mockAnafCompanySuccess({ cui: 23067611, name: 'LATERAL SRL', inactive: false });

    const result = await getCompanyFromANAFWithFallback('23067611');
    expect(result).not.toBeNull();
    expect(result.cui).toBe(23067611);
  });

  test('getCompanyFromANAFWithFallback retries on failure', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error 1'))
      .mockRejectedValueOnce(new Error('Network error 2'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { cui: 23067611, name: 'LATERAL SRL' } }),
      });

    const result = await getCompanyFromANAFWithFallback('23067611');
    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
