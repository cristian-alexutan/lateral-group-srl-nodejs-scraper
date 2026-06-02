# Lateral Group SRL - Node.js Scraper

Web scraper pentru a aduce locurile de munca de la Lateral Group in platforma [peviitor.ro](https://peviitor.ro).

## Company Details

- **Brand**: Lateral Group
- **Legal Name**: LATERAL SRL
- **CUI/CIF**: 23067611
- **Registration Number**: J2008000046262
- **Source**: Teamtailor RSS Feed

## Usage

```bash
npm install
npm run scrape
```

## Structure

- `index.js` - Main scraper orchestrator
- `company.js` - Company validation and ANAF integration
- `demoanaf.js` - ANAF API client
- `solr.js` - Solr database operations
- `delete_request.json` - Solr delete query template
- `company.json` - Cached company data from ANAF

## Scraping Flow

1. Query Solr for existing jobs by CIF
2. Validate company via ANAF API
3. Scrape job listings from Teamtailor RSS feed
4. Map jobs to the standard job model
5. Transform jobs for Solr (filter Romanian cities, normalize fields)
6. Upsert jobs to Solr
7. Save backup to `jobs.json`

## Job Source

Uses the Teamtailor RSS feed:
```
https://careers.lateralgroup.com/jobs.rss
```
