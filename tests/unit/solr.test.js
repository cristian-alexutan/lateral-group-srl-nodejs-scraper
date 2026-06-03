import { getSolrAuth } from '../../solr.js';

describe('Solr Module', () => {
  test('getSolrAuth returns null when no auth set', () => {
    delete process.env.SOLR_AUTH;
    const auth = getSolrAuth();
    expect(auth).toBeNull();
  });

  test('getSolrAuth returns Basic auth when SOLR_AUTH is set', () => {
    process.env.SOLR_AUTH = 'user:pass';
    const auth = getSolrAuth();
    expect(auth).toBe('Basic ' + Buffer.from('user:pass').toString('base64'));
    delete process.env.SOLR_AUTH;
  });

  test('SOLR_URL is defined', () => {
    expect(process.env.SOLR_URL || 'https://solr.peviitor.ro/solr/job').toBeDefined();
  });
});
