"""veritahire - live US job postings, verified on employers' own career sites.

    from veritahire import search_jobs, job_status, get_job, feed

    for job in search_jobs("registered nurse", "Austin, TX"):
        print(job["title"], job["employer"], job["apply_url"])

    job_status("https://careers.example.com/job/12345")["status"]   # open / closed / unknown

    for row in feed(api_key="vh_...", state="CA", category="healthcare_clinical"):   # full feed, needs a key
        print(row["title"])

Docs and a free trial key: https://veritahire.com/developers/  OpenAPI: https://veritahire.com/openapi.json
"""
import time
import requests

__version__ = "0.1.0"
BASE = "https://veritahire.com"
_UA = "veritahire-python/" + __version__


class VeritaHireError(Exception):
    pass


def _get(path, params=None, api_key=None, retries=2):
    headers = {"User-Agent": _UA}
    if api_key:
        headers["X-API-Key"] = api_key
    for attempt in range(retries + 1):
        r = requests.get(BASE + path, params=params, headers=headers, timeout=60)
        if r.status_code == 503 and attempt < retries:          # busy: the API says so instead of returning zero
            time.sleep(int(r.json().get("retry_after_seconds", 30)))
            continue
        if r.status_code >= 400:
            raise VeritaHireError("%s %s: %s" % (r.status_code, path, r.text[:300]))
        return r.json()


def search_jobs(what="", where="", radius_miles=25, min_pay=None, employment_type=None, remote_only=False,
                posted_within_days=None):
    """Up to 25 live jobs near a place (no key). min_pay: annual, or hourly if under 300."""
    p = {"what": what, "where": where, "radius_miles": radius_miles}
    if min_pay: p["min_pay"] = min_pay
    if employment_type: p["employment_type"] = employment_type
    if remote_only: p["remote_only"] = 1
    if posted_within_days: p["posted_within_days"] = posted_within_days
    return _get("/api/jobs-search.php", p)["jobs"]


def job_status(url=None, job_id=None):
    """Is a posting still on the employer's own site? (no key) -> dict with status open / closed / unknown."""
    return _get("/api/job-status.php", {"url": url} if url else {"job_id": job_id})


def get_job(job_id):
    """One posting in full: description, requirements, pay, status (no key)."""
    return _get("/api/job.php", {"job_id": job_id})


def feed(api_key, limit=100, **filters):
    """Every live posting matching the filters (state, category, remote, employer_id, platform, since), cursor-paged.
    Needs a key - free trial at https://veritahire.com/developers/"""
    after = 0
    while True:
        page = _get("/api/v1/jobs.php", dict(filters, limit=limit, after=after), api_key=api_key)
        for row in page["data"]:
            yield row
        after = page.get("next_after")
        if not after:
            return
