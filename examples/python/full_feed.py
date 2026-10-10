"""Every live posting matching a filter, cursor-paged. Needs a key: free trial (2,000 records) at
https://veritahire.com/developers/

    VERITAHIRE_KEY=vh_... python full_feed.py CA healthcare_clinical
"""
import os
import sys
import requests

key = os.environ.get("VERITAHIRE_KEY")
if not key:
    sys.exit("Set VERITAHIRE_KEY (free trial key: https://veritahire.com/developers/)")
state = sys.argv[1] if len(sys.argv) > 1 else "CA"
category = sys.argv[2] if len(sys.argv) > 2 else "healthcare_clinical"

after, total = 0, 0
while True:
    r = requests.get("https://veritahire.com/api/v1/jobs.php",
                     headers={"X-API-Key": key},
                     params={"state": state, "category": category, "limit": 100, "after": after}, timeout=60)
    r.raise_for_status()
    page = r.json()
    rows = page["data"]
    total += len(rows)
    for job in rows:
        print(job["job_id"], job["title"], "|", job["employer"], "|", job.get("pay_text") or "pay not posted",
              "| last on the employer's site", job["last_seen_in_feed"])
    after = page["next_after"]          # null on the last page
    if not after:
        break
print(f"{total} live postings; quota used {page['quota']['used']} of {page['quota']['limit']}")
