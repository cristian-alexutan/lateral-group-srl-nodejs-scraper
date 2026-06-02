let parseRSSJobs, mapToJobModel, transformJobsForSOLR;

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:tt="https://teamtailor.com/locations">
  <channel>
    <title>Lateral Group</title>
    <description>Join us!</description>
    <link>https://careers.lateralgroup.com/jobs</link>
    <item>
      <title>Senior .NET / Blazor Engineer (Romania)</title>
      <description>Some description</description>
      <pubDate>Thu, 13 Nov 2025 08:51:49 -0500</pubDate>
      <link>https://careers.lateralgroup.com/jobs/6758878-senior-net-blazor-engineer-romania</link>
      <remoteStatus>fully</remoteStatus>
      <guid>040e60ab-31ba-47ab-9707-11416638b511</guid>
      <tt:locations>
        <tt:location>
          <tt:city>Cluj-Napoca</tt:city>
          <tt:country>Romania</tt:country>
        </tt:location>
      </tt:locations>
      <tt:department>Backend Engineering</tt:department>
    </item>
    <item>
      <title>Senior DBA / Database Architect (Florida)</title>
      <description>Some description</description>
      <pubDate>Thu, 01 Jun 2025 06:58:21 -0400</pubDate>
      <link>https://careers.lateralgroup.com/jobs/5944275-senior-dba-database-architect-florida</link>
      <remoteStatus>fully</remoteStatus>
      <guid>5944275</guid>
      <tt:locations>
        <tt:location>
          <tt:city>Florida</tt:city>
          <tt:country>United States</tt:country>
        </tt:location>
      </tt:locations>
      <tt:department>Backend Engineering</tt:department>
    </item>
  </channel>
</rss>`;

beforeAll(async () => {
  const mod = await import('../../index.js');
  parseRSSJobs = mod.parseRSSJobs;
  mapToJobModel = mod.mapToJobModel;
  transformJobsForSOLR = mod.transformJobsForSOLR;
});

describe('Index Module', () => {
  test('parseRSSJobs extracts only Romanian jobs from RSS feed', () => {
    const jobs = parseRSSJobs(SAMPLE_RSS);
    expect(jobs.length).toBe(1);
    expect(jobs[0].title).toBe('Senior .NET / Blazor Engineer (Romania)');
    expect(jobs[0].workmode).toBe('remote');
    expect(jobs[0].location).toContain('Cluj-Napoca');
  });

  test('mapToJobModel adds status and removes undefined fields', () => {
    const raw = {
      url: 'https://careers.lateralgroup.com/jobs/6758878',
      title: 'Test Job',
      workmode: 'hybrid',
      location: ['Cluj-Napoca'],
      tags: ['backend-engineering'],
    };
    const job = mapToJobModel(raw, '23067611', 'LATERAL SRL');
    expect(job.status).toBe('scraped');
    expect(job.cif).toBe('23067611');
    expect(job.company).toBe('LATERAL SRL');
    expect(job.date).toBeDefined();
  });

  test('transformJobsForSOLR filters locations and normalizes', () => {
    const jobs = [
      {
        url: 'https://careers.lateralgroup.com/jobs/6758878',
        title: 'Test',
        company: 'LATERAL SRL',
        cif: '23067611',
        location: ['Cluj-Napoca'],
        tags: ['backend-engineering'],
        workmode: 'hybrid',
        date: new Date().toISOString(),
        status: 'scraped',
      },
    ];
    const transformed = transformJobsForSOLR(jobs);
    expect(transformed[0].location).toContain('Cluj-Napoca');
    expect(transformed[0].company).toBe('LATERAL SRL');
    expect(transformed[0].workmode).toBe('hybrid');
  });

  test('parsed job has uid and tags from department', () => {
    const jobs = parseRSSJobs(SAMPLE_RSS);
    expect(jobs[0].uid).toBe('040e60ab-31ba-47ab-9707-11416638b511');
    expect(jobs[0].tags).toContain('backend-engineering');
  });
});
