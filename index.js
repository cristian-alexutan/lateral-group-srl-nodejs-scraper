import fetch from 'node-fetch';
import * as company from './company.js';
import * as solr from './solr.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';

const COMPANY_BRAND = 'Lateral Group';
const COMPANY_CIF = '23067611';
const COMPANY_NAME = 'LATERAL SRL';
const CAREERS_RSS_URL = 'https://careers.lateralgroup.com/jobs.rss';
const TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const ROMANIAN_CITIES = new Set([
  'Alba Iulia', 'Arad', 'Bacău', 'Baia Mare', 'Bistrița', 'Botoșani', 'Brașov', 'Brăila',
  'București', 'Bucharest', 'Buzău', 'Cluj', 'Cluj-Napoca', 'Jucu', 'Constanța', 'Craiova', 'Deva',
  'Drobeta-Turnu Severin', 'Focșani', 'Galați', 'Giurgiu', 'Iași', 'Oradea',
  'Piatra Neamț', 'Pitești', 'Ploiești', 'Râmnicu Vâlcea', 'Reșița',
  'Satu Mare', 'Sfântu Gheorghe', 'Sibiu', 'Slatina', 'Slobozia', 'Suceava',
  'Târgoviște', 'Târgu Jiu', 'Târgu Mureș', 'Timișoara', 'Tulcea', 'Vaslui', 'Zalău',
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRSSJobs(xmlText) {
  const jobs = [];
  const noNsXml = xmlText.replace(/(<\/?)[\w-]+:([\w-]+)/g, '$1$2');
  const channelMatch = noNsXml.match(/<channel>([\s\S]*?)<\/channel>/);
  if (!channelMatch) return jobs;

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(channelMatch[1])) !== null) {
    const item = itemMatch[1];

    const title = extractTag(item, 'title');
    const link = extractTag(item, 'link');
    const guid = extractTag(item, 'guid');
    const pubDate = extractTag(item, 'pubDate');
    const remoteStatus = extractTag(item, 'remoteStatus');
    const department = extractTag(item, 'department');
    const description = extractTag(item, 'description');

    const locations = [];
    const locationRegex = /<location>([\s\S]*?)<\/location>/g;
    let locMatch;
    while ((locMatch = locationRegex.exec(item)) !== null) {
      const locXml = locMatch[1];
      const city = extractTag(locXml, 'city');
      const country = extractTag(locXml, 'country');
      locations.push({ city, country });
    }

    if (!title || !guid) continue;

    const roLocations = locations
      .filter(l => l.country && l.country.toLowerCase() === 'romania')
      .map(l => l.city);

    if (roLocations.length === 0 && !item.toLowerCase().includes('romania')) continue;

    const citySet = new Set(roLocations.flatMap(c => c.split(',').map(s => s.trim())));

    let workmode = 'on-site';
    if (remoteStatus === 'fully') workmode = 'remote';
    else if (remoteStatus === 'hybrid') workmode = 'hybrid';

    const tags = [];
    if (department) {
      tags.push(department.toLowerCase().replace(/\s+/g, '-'));
    }

    const url = link || `https://careers.lateralgroup.com/jobs/${guid}`;

    jobs.push({
      url,
      title: title || '',
      uid: guid,
      workmode,
      location: [...citySet].filter(Boolean),
      tags,
      remote: workmode === 'remote',
      hybrid: workmode === 'hybrid',
      pubDate,
    });
  }

  return jobs;
}

function extractTag(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`));
  return match ? match[1].trim() : '';
}

async function fetchRSSFeed() {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(CAREERS_RSS_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(TIMEOUT),
      });

      if (!response.ok) {
        lastError = new Error(`RSS feed error: ${response.status} ${response.statusText}`);
        console.log(`RSS attempt ${attempt}/${MAX_RETRIES} failed: ${response.status}, retrying...`);
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
        continue;
      }

      return response.text();
    } catch (err) {
      lastError = err;
      console.log(`RSS attempt ${attempt}/${MAX_RETRIES} error: ${err.message}, retrying...`);
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError || new Error('RSS feed failed after retries');
}

async function scrapeAllListings() {
  const xmlText = await fetchRSSFeed();
  const jobs = parseRSSJobs(xmlText);
  return jobs;
}

function mapToJobModel(rawJob, cif, companyName) {
  const job = {
    url: rawJob.url,
    title: rawJob.title,
    company: companyName,
    cif,
    location: rawJob.location,
    tags: rawJob.tags,
    workmode: rawJob.workmode,
    date: new Date().toISOString(),
    status: 'scraped',
  };

  job.location = job.location || [];
  job.tags = job.tags || [];

  return job;
}

function transformJobsForSOLR(payload) {
  return payload.map(job => {
    const locations = (job.location || [])
      .map(loc => {
        const city = loc.split(',')[0].trim();
        if (ROMANIAN_CITIES.has(city)) return city;
        if (ROMANIAN_CITIES.has(loc.trim())) return loc.trim();
        return null;
      })
      .filter(Boolean);

    const workmode = typeof job.workmode === 'string' ? job.workmode.toLowerCase() : 'on-site';

    return {
      ...job,
      company: COMPANY_NAME,
      location: locations.length > 0 ? locations : ['România'],
      workmode,
    };
  });
}

async function main() {
  console.log(`[${COMPANY_BRAND} Scraper] Starting...`);

  try {
    try {
      const existingResult = await solr.querySOLR(COMPANY_CIF);
      const existingCount = existingResult?.response?.numFound || 0;
      console.log(`[${COMPANY_BRAND} Scraper] Existing jobs in SOLR: ${existingCount}`);
    } catch (e) {
      console.warn(`[${COMPANY_BRAND} Scraper] SOLR unavailable (${e.message}), continuing without existing count`);
    }

    try {
      const companyData = await company.validateAndGetCompany();
      if (companyData && companyData.status === 'active') {
        console.log(`[${COMPANY_BRAND} Scraper] Company validated: ${companyData.company} (CIF: ${companyData.cif})`);
      } else {
        console.warn(`[${COMPANY_BRAND} Scraper] Company validation: ${companyData?.status || 'unknown'}`);
      }
    } catch (e) {
      console.warn(`[${COMPANY_BRAND} Scraper] Company validation skipped (${e.message})`);
    }

    const rawJobs = await scrapeAllListings();
    console.log(`[${COMPANY_BRAND} Scraper] Scraped ${rawJobs.length} raw jobs`);

    const mappedJobs = rawJobs.map(job => mapToJobModel(job, COMPANY_CIF, COMPANY_NAME));
    console.log(`[${COMPANY_BRAND} Scraper] Mapped ${mappedJobs.length} jobs`);

    const solrReadyJobs = transformJobsForSOLR(mappedJobs);
    console.log(`[${COMPANY_BRAND} Scraper] Transformed ${solrReadyJobs.length} jobs for SOLR`);

    if (solrReadyJobs.length > 0) {
      try {
        console.log(`[${COMPANY_BRAND} Scraper] Deleting existing jobs for CIF ${COMPANY_CIF}...`);
        await solr.deleteJobsByCIF(COMPANY_CIF);
        console.log(`[${COMPANY_BRAND} Scraper] Old jobs deleted. Upserting ${solrReadyJobs.length} jobs...`);
        const result = await solr.upsertJobs(solrReadyJobs);
        console.log(`[${COMPANY_BRAND} Scraper] Upsert result:`, result);
      } catch (e) {
        console.warn(`[${COMPANY_BRAND} Scraper] SOLR upsert failed (${e.message}), saving locally only`);
      }
    }

    writeFileSync('jobs.json', JSON.stringify(solrReadyJobs, null, 2));
    console.log(`[${COMPANY_BRAND} Scraper] Jobs saved to jobs.json`);

    try {
      const companyDoc = {
        id: COMPANY_CIF,
        company: COMPANY_NAME,
        brand: COMPANY_BRAND,
        status: 'activ',
        website: ['https://lateralgroup.com'],
        career: ['https://careers.lateralgroup.com'],
        lastScraped: new Date().toISOString(),
        scraperFile: 'https://github.com/cristian-alexutan/lateral-group-srl-nodejs-scraper/blob/main/index.js',
      };
      const companyResult = await solr.upsertCompany(companyDoc);
      console.log(`[${COMPANY_BRAND} Scraper] Company upsert result:`, companyResult);
    } catch (e) {
      console.warn(`[${COMPANY_BRAND} Scraper] Company upsert failed (${e.message})`);
    }

    console.log(`[${COMPANY_BRAND} Scraper] Done! ${solrReadyJobs.length} jobs processed.`);
  } catch (err) {
    console.error(`[${COMPANY_BRAND} Scraper] Error:`, err.message);
    process.exit(1);
  }
}

export { parseRSSJobs, mapToJobModel, transformJobsForSOLR };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
