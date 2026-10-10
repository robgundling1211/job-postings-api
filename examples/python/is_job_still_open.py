"""Is a job posting still on the employer's own careers site? No key needed.

    python is_job_still_open.py https://careers.example.com/job/12345
"""
import sys
import requests

url = sys.argv[1] if len(sys.argv) > 1 else "https://veritahire.com/j/9526216"
r = requests.get("https://veritahire.com/api/job-status.php", params={"url": url}, timeout=30)
r.raise_for_status()
s = r.json()
print(s["status"])                     # open, closed or unknown
for k in ("title", "employer", "last_confirmed_on_employer_site", "last_seen_on_employer_site", "detail"):
    if s.get(k):
        print(f"{k}: {s[k]}")
