#!/usr/bin/env node
// ============================================================
// CFR Watch — main entry script
// ------------------------------------------------------------
// Reads cfr-watch-list.json, fetches current content per entry,
// diffs against stored baseline, emits change reports.
//
// Usage:
//   npm run cfr:watch                  — run all entries, console output
//   npm run cfr:watch -- --github      — emit GitHub issue bodies (CI mode)
//   npm run cfr:baseline               — refresh all baselines
//   npm run cfr:baseline -- <entry-id> — refresh single entry
//
// Exit codes:
//   0 — all entries unchanged or first-baseline (informational)
//   1 — fetch errors (transient or permanent — operator to investigate)
//   2 — substantive changes detected (changed status with tag)
// ============================================================

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchRegContent } from './fetcher.mjs';
import { hashBody, diffBodies, classifyChange } from './differ.mjs';
import { renderConsoleSummary, renderGithubIssueBody } from './reporter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');
const WATCH_LIST_PATH = join(PROJECT_ROOT, 'cfr-watch-list.json');
const BASELINES_DIR = join(PROJECT_ROOT, 'data', 'cfr-baselines');

async function loadWatchList() {
  const json = await readFile(WATCH_LIST_PATH, 'utf-8');
  return JSON.parse(json);
}

async function loadBaseline(entryId) {
  const path = join(BASELINES_DIR, `${entryId}.json`);
  if (!existsSync(path)) return null;
  const json = await readFile(path, 'utf-8');
  return JSON.parse(json);
}

async function saveBaseline(entryId, content, hash) {
  await mkdir(BASELINES_DIR, { recursive: true });
  const path = join(BASELINES_DIR, `${entryId}.json`);
  const record = {
    entryId,
    hash,
    body: content.body,
    version: content.version,
    sourceUrl: content.sourceUrl,
    capturedAt: content.fetchedAt,
  };
  await writeFile(path, JSON.stringify(record, null, 2));
  return path;
}

async function runEntry(entry, { rebaseline = false } = {}) {
  const baseReport = {
    entryId: entry.id,
    citation: entry.citation,
    shortName: entry.shortName,
    sourceUrl: '',
    codebaseReferences: entry.codebaseReferences || [],
  };

  try {
    const content = await fetchRegContent(entry);
    const newHash = hashBody(content.body);
    const baseline = await loadBaseline(entry.id);

    if (rebaseline || !baseline) {
      await saveBaseline(entry.id, content, newHash);
      return {
        ...baseReport,
        status: 'first-baseline',
        sourceUrl: content.sourceUrl,
        newHash,
      };
    }

    if (baseline.hash === newHash) {
      return {
        ...baseReport,
        status: 'unchanged',
        sourceUrl: content.sourceUrl,
        oldHash: baseline.hash,
        newHash,
      };
    }

    const diff = diffBodies(baseline.body, content.body);
    const tag = classifyChange(diff);

    return {
      ...baseReport,
      status: 'changed',
      sourceUrl: content.sourceUrl,
      oldHash: baseline.hash,
      newHash,
      diff,
      tag,
    };
  } catch (err) {
    return {
      ...baseReport,
      status: 'fetch-error',
      error: err.message,
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const githubMode = args.includes('--github');
  const isBaselineCmd = args.includes('--baseline');
  const targetEntryId = args.find(a => !a.startsWith('--'));

  const watchList = await loadWatchList();
  let entries = watchList.watchList;
  if (targetEntryId) {
    entries = entries.filter(e => e.id === targetEntryId);
    if (entries.length === 0) {
      console.error(`No entry found with id "${targetEntryId}". Available: ${watchList.watchList.map(e => e.id).join(', ')}`);
      process.exit(1);
    }
  }

  const reports = [];
  for (const entry of entries) {
    const report = await runEntry(entry, { rebaseline: isBaselineCmd });
    reports.push(report);
  }

  if (githubMode) {
    // Emit per-changed-entry GitHub issue bodies separated by a sentinel
    // so a CI step can split + open issues. Workflow YAML handles the gh
    // CLI invocation per body.
    for (const r of reports) {
      if (r.status === 'changed') {
        console.log('---CFR-WATCH-ISSUE-START---');
        console.log(`ENTRY_ID=${r.entryId}`);
        console.log(`TAG=${r.tag}`);
        console.log(`TITLE=CFR change detected: ${r.citation} (${r.tag})`);
        console.log('BODY<<EOF_BODY');
        console.log(renderGithubIssueBody(r));
        console.log('EOF_BODY');
        console.log('---CFR-WATCH-ISSUE-END---');
      }
    }
  } else {
    console.log(renderConsoleSummary(reports));
  }

  const hasChanges = reports.some(r => r.status === 'changed');
  const hasErrors = reports.some(r => r.status === 'fetch-error');
  if (hasChanges) process.exit(2);
  if (hasErrors) process.exit(1);
  process.exit(0);
}

main().catch(err => {
  console.error('CFR watch fatal error:', err);
  process.exit(1);
});
