# Robots.txt Analysis — Lateral Group Careers

Sursa: https://careers.lateralgroup.com/robots.txt

## Reguli

```
User-agent: *
Allow: /
```

## Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/` (landing) | ✅ Da | Pagina principală cariere |
| `/jobs.rss` | ✅ Da | RSS feed cu toate job-urile |
| `/jobs/*` | ✅ Da | Paginile individuale de job |

## Recomandare

Site-ul permite complet accesul tuturor crawler-elor. Scraperul nostru face o singură cerere per RSS feed cu rate limiting — comportament rezonabil.
