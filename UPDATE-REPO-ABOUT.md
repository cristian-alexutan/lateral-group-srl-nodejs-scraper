# Actualizare About repo pe GitHub

Pentru a actualiza secțiunea **About** din dreapta paginii principale a repo-ului pe GitHub (descriere, website, topics):

## CLI (gh)

```bash
# Descriere
gh repo edit cristian-alexutan/lateral-group-srl-nodejs-scraper \
  --description "web scraper pentru a aduce locurile de munca de la Lateral Group in platforma peviitor.ro"

# Website
gh repo edit cristian-alexutan/lateral-group-srl-nodejs-scraper \
  --homepage "https://cristian-alexutan.github.io/lateral-group-srl-nodejs-scraper/"

# Topics
gh repo edit cristian-alexutan/lateral-group-srl-nodejs-scraper \
  --add-topic scraper --add-topic lateral --add-topic peviitor --add-topic jobs --add-topic romania
```

## Web UI

1. Mergi la `https://github.com/cristian-alexutan/lateral-group-srl-nodejs-scraper`
2. Click pe ⚙️ **Settings** (tab-ul din dreapta sus)
3. Mergi la secțiunea **General** → **Description**
4. Completează:
   - **Description**: textul de mai sus
   - **Website**: URL-ul GitHub Pages
   - **Topics**: cuvinte cheie separate prin spațiu
5. Click **Save changes**

## Verificare

```bash
gh repo view cristian-alexutan/lateral-group-srl-nodejs-scraper --json description,homepage,topics
```
