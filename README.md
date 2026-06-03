# Lateral Group SRL - Node.js Scraper

[![WebScraper Lateral to Peviitor](https://github.com/cristian-alexutan/lateral-group-srl-nodejs-scraper/actions/workflows/scrape.yml/badge.svg)](https://github.com/cristian-alexutan/lateral-group-srl-nodejs-scraper/actions/workflows/scrape.yml)
[![Automation Tests](https://github.com/cristian-alexutan/lateral-group-srl-nodejs-scraper/actions/workflows/test.yml/badge.svg)](https://github.com/cristian-alexutan/lateral-group-srl-nodejs-scraper/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/javascript-ESM-F7DF1E?logo=javascript&logoColor=black)](https://ecma-international.org/)
[![Node.js](https://img.shields.io/badge/node-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**job_seeker_ro_spider** — un scraper pentru job-urile Lateral Group din România. Extrage anunțurile de pe [Lateral Group Careers](https://careers.lateralgroup.com/) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

## Overview

Proiectul automatizează colectarea zilnică a job-urilor Lateral Group din România, menținând board-ul peviitor.ro la zi cu cele mai recente oportunități de carieră.

## Features

- Extrage job-uri din RSS feed-ul Teamtailor
- Validează compania via ANAF (CUI, status activ/inactiv, adresă completă)
- Cross-validează cu Peviitor API
- Stochează în SOLR (job core + company core)
- GitHub Actions: scrape zilnic + testare automată (unit, integration, e2e)
- Teste SOLR condiționale — auto-skip când `SOLR_AUTH` nu e setat
- Se identifică prin User-Agent: `job_seeker_ro_spider`

## Project Structure

```
├── index.js           # Main scraper entry point
├── company.js         # Company validation via ANAF + Peviitor + SOLR
├── demoanaf.js        # CLI wrapper for src/anaf.js
├── src/anaf.js        # ANAF API core module (search + company details)
├── solr.js            # SOLR operations (query, upsert, delete, company)
├── company.json       # Cached company data (fallback when ANAF is down)
├── ROBOTS.md          # robots.txt analysis and scraping policy
├── tests/             # Test suite
│   ├── unit/          # Unit tests (mocked APIs)
│   ├── integration/   # Integration tests (ANAF + SOLR live, Peviitor skipped)
│   └── e2e/           # E2E tests (full pipeline, real Lateral API)
├── .github/workflows/
│   ├── scrape.yml     # Daily scraping at 6 AM UTC
│   └── test.yml       # Automation Tests on push/PR
└── package.json
```

## Setup

### Prerequisites

- Node.js 24+
- npm

### Installation

```bash
npm install
```

### Configuration

Set the `SOLR_AUTH` environment variable with your Solr credentials:

```bash
export SOLR_AUTH="username:password"
```

## Usage

### Run the Scraper

```bash
npm run scrape
```

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Workflows

### Daily Scraping

The `scrape.yml` workflow runs daily at 6 AM UTC via GitHub Actions. It:
1. Validates company data via ANAF
2. Scrapes current job listings from Lateral Group Teamtailor RSS
3. Updates Solr with new/removed jobs
4. Uploads job data as artifacts

### Test Automation

The `test.yml` workflow runs on every push and pull request. It:
1. Ensures Lateral exists in the company core
2. Runs unit, integration, and E2E tests
3. Validates data integrity in Solr

## Company Details

- **Brand**: Lateral Group
- **Legal Name**: LATERAL SRL
- **CUI/CIF**: 23067611
- **Registration Number**: J2008000046262
- **Source**: Teamtailor RSS Feed

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

## Acknowledgments

This project was developed with assistance from:
- **[OpenCode](https://opencode.ai)** - AI-powered CLI tool for software engineering
- **Big Pickle LLM** - Large language model powering OpenCode

Special thanks to the open source community and the peviitor.ro team for their support.

## License

Copyright (c) 2026 CRISTIAN-ALEXUTAN

Licensed under the [MIT License](LICENSE).

## Managed By

This project is managed by [ASOCIATIA OPORTUNITATI SI CARIERE](https://oportunitatisicariere.ro) and used as a web scraper for the [peviitor.ro](https://peviitor.ro) job board project.
