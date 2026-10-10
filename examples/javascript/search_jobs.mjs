// Live US job postings near a place - no key needed. Node 18+:
//   node search_jobs.mjs "cashier" "Phoenix, AZ"
const what = process.argv[2] ?? "cashier";
const where = process.argv[3] ?? "Phoenix, AZ";

const r = await fetch("https://veritahire.com/api/jobs-search.php?" +
  new URLSearchParams({ what, where, radius_miles: "25" }));
if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
const { jobs, returned } = await r.json();
console.log(`${returned} live jobs for "${what}" near ${where}`);
for (const j of jobs) {
  console.log(`- ${j.title} | ${j.employer} | ${j.pay_as_posted ?? "pay not posted"} | ${j.apply_url}`);
}
