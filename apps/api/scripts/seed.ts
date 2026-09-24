/**
 * Seed script — creates 25 sample work items across all statuses.
 * Run: cd apps/api && npx tsx scripts/seed.ts
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/db/schema.js';

const dbPath = process.env.DATABASE_URL ?? './data/odin.db';
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
const db = drizzle(sqlite, { schema });

const now = new Date().toISOString();

const items = [
  // RECEIVED (5)
  { ext: 'SEED-01', title: 'Missing payslip for applicant #442', desc: 'Applicant has not submitted the required payslip document for January.', status: 'RECEIVED' },
  { ext: 'SEED-02', title: 'Incomplete address on form W-2', desc: 'The W-2 form is missing the city and zip code fields.', status: 'RECEIVED' },
  { ext: 'SEED-03', title: 'Duplicate submission detected', desc: 'Two identical applications received within 5 minutes for the same person.', status: 'RECEIVED' },
  { ext: 'SEED-04', title: 'Expired ID document', desc: 'The provided driver\'s license expired in March 2024.', status: 'RECEIVED' },
  { ext: 'SEED-05', title: 'Bank statement mismatch', desc: 'Bank statement shows different income than declared on application form.', status: 'RECEIVED' },

  // ANALYSING (3)
  { ext: 'SEED-06', title: 'Employment verification pending', desc: 'Awaiting response from employer HR for employment verification.', status: 'ANALYSING' },
  { ext: 'SEED-07', title: 'Credit check in progress', desc: 'Credit bureau report requested, awaiting results.', status: 'ANALYSING' },
  { ext: 'SEED-08', title: 'Identity verification underway', desc: 'ID document scan being reviewed by automated system.', status: 'ANALYSING' },

  // READY_FOR_REVIEW (10)
  { ext: 'SEED-09', title: 'Approved – standard loan application', desc: 'All documents verified. Loan amount within standard limits. Recommend approval.', status: 'READY_FOR_REVIEW', category: 'LOAN_APPROVAL', priority: 'LOW', summary: 'Standard loan application, no flags.', recommendedAction: 'Approve and disburse funds.' },
  { ext: 'SEED-10', title: 'Escalation – high value transaction', desc: 'Transaction exceeds $50k threshold. Requires senior review.', status: 'READY_FOR_REVIEW', category: 'ESCALATION', priority: 'HIGH', summary: 'High-value transaction flagged for review.', recommendedAction: 'Escalate to senior underwriter.' },
  { ext: 'SEED-11', title: 'Missing signature – digitized document', desc: 'The uploaded PDF is a scan but missing the applicant signature page.', status: 'READY_FOR_REVIEW', category: 'DOCUMENT_REQUEST', priority: 'MEDIUM', summary: 'Signature page missing from submission.', recommendedAction: 'Request signed copy from applicant.' },
  { ext: 'SEED-12', title: 'Fraud alert – mismatched SSN', desc: 'SSN on application does not match credit bureau records.', status: 'READY_FOR_REVIEW', category: 'FRAUD_ALERT', priority: 'HIGH', summary: 'SSN mismatch between application and credit bureau.', recommendedAction: 'Flag for fraud investigation.' },
  { ext: 'SEED-13', title: 'Address verification complete', desc: 'Utility bill confirms residential address. All clear.', status: 'READY_FOR_REVIEW', category: 'VERIFICATION', priority: 'LOW', summary: 'Address verified via utility bill.', recommendedAction: 'Mark verification complete.' },
  { ext: 'SEED-14', title: 'Income verification – self-employed', desc: 'Applicant is self-employed. Tax returns provided for last 2 years.', status: 'READY_FOR_REVIEW', category: 'VERIFICATION', priority: 'MEDIUM', summary: 'Self-employed income verified via tax returns.', recommendedAction: 'Calculate average income over 24 months.' },
  { ext: 'SEED-15', title: 'Co-signer documentation needed', desc: 'Primary applicant credit score below threshold. Co-signer required.', status: 'READY_FOR_REVIEW', category: 'DOCUMENT_REQUEST', priority: 'MEDIUM', summary: 'Credit score below minimum. Co-signer option available.', recommendedAction: 'Request co-signer documents.' },
  { ext: 'SEED-16', title: 'Property appraisal completed', desc: 'Appraisal came in at 95% of purchase price. Within acceptable range.', status: 'READY_FOR_REVIEW', category: 'APPRAISAL', priority: 'LOW', summary: 'Property appraised within acceptable LTV range.', recommendedAction: 'Proceed with standard terms.' },
  { ext: 'SEED-17', title: 'Insurance policy verification', desc: 'Homeowner insurance policy verified and active.', status: 'READY_FOR_REVIEW', category: 'VERIFICATION', priority: 'LOW', summary: 'Insurance policy confirmed active.', recommendedAction: 'No action needed.' },
  { ext: 'SEED-18', title: 'Title search complete – no liens', desc: 'Title search returned clean. No outstanding liens or encumbrances.', status: 'READY_FOR_REVIEW', category: 'TITLE_SEARCH', priority: 'LOW', summary: 'Clean title, no issues found.', recommendedAction: 'Proceed to closing.' },

  // COMPLETED (4)
  { ext: 'SEED-19', title: 'Loan disbursed – ref #L-8821', desc: 'Funds transferred to escrow account on June 15.', status: 'COMPLETED', category: 'LOAN_APPROVAL', priority: 'HIGH', summary: 'Loan approved and funds disbursed.', recommendedAction: 'Archive file.' },
  { ext: 'SEED-20', title: 'Application denied – insufficient credit', desc: 'Credit score 540. Below minimum threshold of 620.', status: 'COMPLETED', category: 'REJECTION', priority: 'MEDIUM', summary: 'Application rejected due to credit score.', recommendedAction: 'Send denial letter with credit report reference.' },
  { ext: 'SEED-21', title: 'Document request fulfilled', desc: 'Requested tax returns received and verified.', status: 'COMPLETED', category: 'DOCUMENT_REQUEST', priority: 'LOW', summary: 'Documents received and verified.', recommendedAction: 'Close request.' },
  { ext: 'SEED-22', title: 'Account closed – customer withdrawal', desc: 'Applicant withdrew application before final decision.', status: 'COMPLETED', category: 'WITHDRAWAL', priority: 'LOW', summary: 'Application withdrawn by customer.', recommendedAction: 'Archive and close.' },

  // FAILED (3)
  { ext: 'SEED-23', title: 'AI analysis timed out', desc: 'LLM request exceeded 30s timeout. Retry needed.', status: 'FAILED', aiError: 'AI request timed out' },
  { ext: 'SEED-24', title: 'Malformed AI response', desc: 'Provider returned invalid JSON. Retry needed.', status: 'FAILED', aiError: 'Malformed AI output' },
  { ext: 'SEED-25', title: 'Rate limit exceeded', desc: 'API rate limit hit during peak hours. Retry after cooldown.', status: 'FAILED', aiError: 'API rate limit exceeded' },
];

for (const item of items) {
  db.insert(schema.workItems).values({
    externalId: item.ext,
    title: item.title,
    description: item.desc,
    status: item.status,
    category: (item as any).category ?? null,
    priority: (item as any).priority ?? null,
    summary: (item as any).summary ?? null,
    recommendedAction: (item as any).recommendedAction ?? null,
    aiError: (item as any).aiError ?? null,
    createdAt: now,
    updatedAt: now,
  }).run();
}

console.log(`Seeded ${items.length} work items into ${dbPath}`);
sqlite.close();