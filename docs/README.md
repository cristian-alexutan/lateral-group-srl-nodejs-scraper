# job_seeker_ro_spider

**job_seeker_ro_spider** — scraper pentru job-urile Lateral Group din România.

Extrage anunțurile de pe [Lateral Group Careers](https://careers.lateralgroup.com) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

## Identificare

Toate request-urile HTTP folosesc User-Agent-ul:

```
job_seeker_ro_spider
```

## Ce face

1. **Validează compania** — interoghează API-ul public ANAF ([demoanaf.ro](https://demoanaf.ro)) după CIF-ul Lateral (23067611) și verifică:
   - Denumirea oficială: LATERAL SRL
   - Status: activ/inactiv/radiat
   - Adresa completă din registrul comerțului
2. **Cross-validează cu Peviitor** — verifică existența companiei în API-ul Peviitor
3. **Scrape-uiește job-urile** — extrage lista completă de job-uri din RSS feed-ul Teamtailor
4. **Transformă datele** — normalizează locațiile (doar orașe românești), tag-urile (lowercase), workmode-ul (remote/on-site/hybrid)
5. **Stochează în SOLR** — upsert în `job` core (job-urile) și `company` core (datele companiei)

## Structură proiect

```
├── index.js           # Orchestrator principal
├── company.js         # Validare companie (ANAF + Peviitor + SOLR)
├── demoanaf.js        # CLI wrapper pentru src/anaf.js
├── src/anaf.js        # Modul ANAF API (search + company details)
├── solr.js            # Operații SOLR (query, upsert, delete, company)
├── company.json       # Cache companie (fallback când ANAF e down)
├── ROBOTS.md          # Analiză robots.txt și politici de scraping
├── tests/
│   ├── unit/          # Teste unitare (API-uri mock-uite)
│   ├── integration/   # Teste de integrare (ANAF + SOLR conditional)
│   └── e2e/           # Teste end-to-end (pipeline complet)
└── .github/workflows/
    ├── scrape.yml     # Rulează zilnic la 6 AM UTC
    └── test.yml       # Teste automate la fiecare push/PR
```

## API-uri folosite

| API | URL | Autentificare |
|---|---|---|
| Lateral Group RSS | `https://careers.lateralgroup.com/jobs.rss` | Public |
| ANAF (demoanaf) | `https://demoanaf.ro/api/...` | Public |
| Peviitor | `https://api.peviitor.ro/v1/company/` | Public |
| SOLR (job core) | `https://solr.peviitor.ro/solr/job` | `SOLR_AUTH` |
| SOLR (company core) | `https://solr.peviitor.ro/solr/company` | `SOLR_AUTH` |

## Testare

```bash
# Toate testele
npm test

# Doar unitare
npm run test:unit

# Doar integrare (necesită ANAF live, SOLR conditional)
npm run test:integration

# Doar E2E (API real Lateral + ANAF + SOLR)
npm run test:e2e
```
