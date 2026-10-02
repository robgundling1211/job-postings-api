# Job postings API: live US jobs, verified on employers' own career sites

Looking for an **Indeed API**, a **LinkedIn jobs API** or a **Glassdoor API** to search job postings? LinkedIn's talent APIs
are for posting jobs and taking applications through partner applicant-tracking systems, and Indeed's developer
documentation is its partner program. **VeritaHire** reads employers' own career sites directly (Workday, Greenhouse,
iCIMS, SmartRecruiters and more), so there is no board in between to close the door, and no stale copies: a job that
leaves the employer's site is marked closed within about 36 hours, and every record says when it was last confirmed there.

- **No key** to start: search live jobs, read a whole posting, check whether any posting URL is still open.
- **One key** for the full feed: every live posting, cursor-paged, plus hiring velocity and employer profiles.
  Free trial key (2,000 records, 30 days): <https://veritahire.com/developers/>
- **OpenAPI** for every endpoint: <https://veritahire.com/openapi.json>
- **MCP server** for AI agents: `https://veritahire.com/mcp` (registry: `com.veritahire/jobs`)

## Quickstart (no key)

```bash
curl "https://veritahire.com/api/jobs-search.php?what=registered+nurse&where=Austin,+TX"
```

```python
import requests

r = requests.get("https://veritahire.com/api/jobs-search.php",
                 params={"what": "registered nurse", "where": "Austin, TX", "radius_miles": 25})
for job in r.json()["jobs"]:
    print(job["title"], "|", job["employer"], "|", job["pay_as_posted"], "|", job["apply_url"])
```

```javascript
const r = await fetch("https://veritahire.com/api/jobs-search.php?" +
  new URLSearchParams({ what: "cashier", where: "Phoenix, AZ" }));
const { jobs } = await r.json();
jobs.forEach(j => console.log(j.title, j.employer, j.last_confirmed_on_employer_site));
```

Each job carries posted pay (never estimated), what the posting asks for (education, licences, years), distance, the
employer's own apply link, and when it was last confirmed on the employer's site.

## Is a posting still open?

```bash
curl "https://veritahire.com/api/job-status.php?url=https://careers.example.com/job/12345"
# {"status": "open" | "closed" | "unknown", "last_confirmed_on_employer_site": "...", ...}
```

## The full feed (key)

```bash
curl -H "X-API-Key: vh_..." "https://veritahire.com/api/v1/jobs.php?state=CA&category=healthcare_clinical&limit=100"
```

Cursor-paged with `after` / `next_after`; full row reference in the OpenAPI file. Paid tiers:
<https://veritahire.com/verified-jobs-feed/>

## Examples in this repo

| | |
|---|---|
| `examples/python/search_jobs.py` | live jobs near a place (no key) |
| `examples/python/is_job_still_open.py` | open / closed / unknown for any posting URL (no key) |
| `examples/python/full_feed.py` | every live posting for a state and category, paged (key) |
| `examples/javascript/search_jobs.mjs` | live jobs near a place, Node 18+ (no key) |
| `examples/javascript/is_job_still_open.mjs` | still-open check, Node 18+ (no key) |

## Limits

Free endpoints return one page of up to 25 jobs and are rate-limited per address; every response states the filters it
applied, and a search that runs out of time says so (HTTP 503 with `retry_after_seconds`) rather than returning zero.

## Where the data comes from

Public job postings on employers' own career sites, read from the site or the applicant-tracking system it runs on. We
do not copy other job boards. Questions: data@veritahire.com

This repository holds examples and documentation only (MIT licence). The API itself is a hosted service.

## Client libraries

Tiny clients with the same four calls (`search_jobs` / `searchJobs`, `job_status` / `jobStatus`, `get_job` / `getJob`,
`feed`), retrying when the API reports it is busy. Source in `clients/python` and `clients/js`.

```bash
pip install veritahire        # Python
npm install veritahire        # JavaScript (Node 18+, browsers, Deno, Bun)
```

```python
from veritahire import search_jobs, job_status
for job in search_jobs("registered nurse", "Austin, TX"):
    print(job["title"], job["employer"], job["apply_url"])
print(job_status(url="https://careers.example.com/job/12345")["status"])
```

```javascript
import { searchJobs, jobStatus } from "veritahire";
const jobs = await searchJobs({ what: "electrician", where: "Las Vegas, NV" });
console.log((await jobStatus({ url: "https://careers.example.com/job/12345" })).status);
```
