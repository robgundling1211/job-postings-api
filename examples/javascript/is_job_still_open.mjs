// Is a job posting still on the employer's own careers site? No key needed. Node 18+:
//   node is_job_still_open.mjs https://careers.example.com/job/12345
const url = process.argv[2] ?? "https://veritahire.com/j/9526216";
const r = await fetch("https://veritahire.com/api/job-status.php?" + new URLSearchParams({ url }));
const s = await r.json();
console.log(s.status, s.title ?? "", s.last_confirmed_on_employer_site ?? s.last_seen_on_employer_site ?? s.detail ?? "");
