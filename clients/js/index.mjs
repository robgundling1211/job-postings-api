// veritahire - live US job postings, verified on employers' own career sites. Node 18+ / browsers / Deno / Bun.
//   import { searchJobs, jobStatus, getJob, feed } from "veritahire";
// Docs and a free trial key: https://veritahire.com/developers/  OpenAPI: https://veritahire.com/openapi.json
const BASE = "https://veritahire.com";

async function get(path, params = {}, apiKey) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`${BASE}${path}?${qs}`, { headers: apiKey ? { "X-API-Key": apiKey } : {} });
    if (r.status === 503 && attempt < 2) {          // busy: the API says so instead of returning zero
      const b = await r.json().catch(() => ({}));
      await new Promise(res => setTimeout(res, (b.retry_after_seconds ?? 30) * 1000));
      continue;
    }
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
