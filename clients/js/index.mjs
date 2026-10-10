// veritahire - live US job postings, verified on employers' own career sites. Node 18+ / browsers / Deno / Bun.
//   import { searchJobs, jobStatus, getJob, feed, competitiveHiringReport, hiringMarket } from "veritahire";
// Docs and a free trial key: https://veritahire.com/developers/  OpenAPI: https://veritahire.com/openapi.json
const BASE = "https://veritahire.com";

async function get(path, params = {}, apiKey, accept202 = false) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`${BASE}${path}?${qs}`, { headers: apiKey ? { "X-API-Key": apiKey } : {} });
    if (r.status === 503 && attempt < 2) {          // busy: the API says so instead of returning zero
      const b = await r.json().catch(() => ({}));
      await new Promise(res => setTimeout(res, (b.retry_after_seconds ?? 30) * 1000));
      continue;
    }
    if (r.status === 202 && accept202) return r.json();
    if (!r.ok) throw new Error(`VeritaHire ${r.status} ${path}: ${(await r.text()).slice(0, 300)}`);
    return r.json();
  }
}

/** Up to 25 live jobs near a place (no key). */
export async function searchJobs({ what, where, radiusMiles = 25, minPay, employmentType, remoteOnly, postedWithinDays } = {}) {
  const b = await get("/api/jobs-search.php", { what, where, radius_miles: radiusMiles, min_pay: minPay,
    employment_type: employmentType, remote_only: remoteOnly ? 1 : undefined, posted_within_days: postedWithinDays });
  return b.jobs;
}

/** Is a posting still on the employer's own site? (no key) -> { status: "open" | "closed" | "unknown", ... } */
export const jobStatus = ({ url, jobId }) => get("/api/job-status.php", url ? { url } : { job_id: jobId });

/** One posting in full (no key). */
export const getJob = (jobId) => get("/api/job.php", { job_id: jobId });

/** Every live posting matching the filters, cursor-paged (needs a key: https://veritahire.com/developers/). */
export async function* feed({ apiKey, limit = 100, ...filters }) {
  let after = 0;
  while (true) {
    const page = await get("/api/v1/jobs.php", { ...filters, limit, after }, apiKey);
    yield* page.data;
    after = page.next_after;
    if (!after) return;
  }
}

/** The Competitive Hiring Report summary for one US healthcare, finance, IT, engineering, science, HR, legal or marketing posting (no key): how fast the same role closes
 *  within 25 miles and how fast this employer usually closes it, the pay each competitor posts, who else is hiring it,
 *  recent closes, and openings vs closings nearby over the last 4 weeks. A role not yet built answers "building"; this
 *  waits and asks again for up to waitSeconds. Sample of the full report: https://veritahire.com/r/sample */
export async function competitiveHiringReport({ jobUrl, jobId, employer, title, city, state, waitSeconds = 300 } = {}) {
  const deadline = Date.now() + waitSeconds * 1000;
  while (true) {
    const r = await get("/api/benchmark.php", { job_url: jobUrl, job_id: jobId, employer, title, city, state }, undefined, true);
    if (r.status !== "building" || Date.now() >= deadline) return r;
    await new Promise(res => setTimeout(res, (r.retry_after_seconds ?? 90) * 1000));
  }
}

/** The hiring market for one US healthcare, finance, IT, engineering, science, HR, legal or marketing occupation, nationally or in a state (no key): live postings, employers
 *  hiring, posted pay range, experience and education asked, employment type and shift mix, and how fast the role closes. */
export const hiringMarket = ({ occupation, state = "US" }) => get("/api/hiring-market.php", { occupation, state });
