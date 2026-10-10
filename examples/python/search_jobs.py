"""Live US job postings near a place - no key needed.

    python search_jobs.py "registered nurse" "Austin, TX"
"""
import sys
import requests

what = sys.argv[1] if len(sys.argv) > 1 else "registered nurse"
where = sys.argv[2] if len(sys.argv) > 2 else "Austin, TX"

r = requests.get("https://veritahire.com/api/jobs-search.php",
                 params={"what": what, "where": where, "radius_miles": 25}, timeout=60)
r.raise_for_status()
data = r.json()
print(f"{data['returned']} live jobs for {what!r} near {where} (filters applied: {data['filters_applied']})")
for job in data["jobs"]:
    pay = job["pay_as_posted"] or "pay not posted"
    print(f"- {job['title']} | {job['employer']} | {job['location']} | {pay}")
    print(f"  apply: {job['apply_url']}  (confirmed on the employer's site {job['last_confirmed_on_employer_site']})")
