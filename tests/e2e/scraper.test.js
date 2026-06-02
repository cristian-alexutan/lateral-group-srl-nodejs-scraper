describe('E2E: Scraper', () => {
  test('Lateral Group careers page is reachable', async () => {
    const response = await fetch('https://careers.lateralgroup.com/jobs.rss', {
      signal: AbortSignal.timeout(10000),
    });
    expect(response.ok).toBe(true);
    const text = await response.text();
    expect(text).toContain('<rss');
    expect(text).toContain('<item>');
  });

  test('RSS feed returns valid jobs', async () => {
    const response = await fetch('https://careers.lateralgroup.com/jobs.rss', {
      signal: AbortSignal.timeout(10000),
    });
    const text = await response.text();
    const itemCount = (text.match(/<item>/g) || []).length;
    expect(itemCount).toBeGreaterThan(0);
    expect(text).toContain('Lateral Group');
  });
});
