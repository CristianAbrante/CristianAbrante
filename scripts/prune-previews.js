#!/usr/bin/env node

/**
 * Prunes old Cloudflare Pages preview deployments.
 *
 * Cloudflare Pages has no TTL: every deployment ever made stays reachable
 * forever, at both its immutable hash URL and its branch alias. This script is
 * the retention policy, run on a schedule.
 *
 * Deployments are deleted when they are preview-environment AND older than
 * --max-age-days AND their branch is not in --keep. Production deployments are
 * never touched.
 *
 * Usage:
 *   node scripts/prune-previews.js --project NAME [--max-age-days 30]
 *                                 [--keep pr-48,pr-49] [--dry-run]
 *
 * Requires CLOUDFLARE_API_TOKEN (Pages: Edit) and CLOUDFLARE_ACCOUNT_ID.
 */

const API_ROOT = 'https://api.cloudflare.com/client/v4';
const PER_PAGE = 50;

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (flag, fallback) => {
    const index = args.indexOf(flag);
    return index !== -1 && args[index + 1] ? args[index + 1] : fallback;
  };
  return {
    project: value('--project', process.env.CF_PAGES_PROJECT || ''),
    maxAgeDays: Number(value('--max-age-days', '30')),
    keep: new Set(
      value('--keep', '')
        .split(',')
        .map(branch => branch.trim())
        .filter(Boolean)
    ),
    dryRun: args.includes('--dry-run'),
  };
}

async function api(path, { token, method = 'GET' }) {
  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${method} ${path} → HTTP ${response.status}, non-JSON response`);
  }

  if (!response.ok || payload.success === false) {
    const detail = (payload.errors || [])
      .map(error => `${error.code}: ${error.message}`)
      .join('; ');
    throw new Error(`${method} ${path} → HTTP ${response.status} ${detail || ''}`.trim());
  }
  return payload;
}

async function listAllDeployments({ account, project, token }) {
  const deployments = [];
  for (let page = 1; ; page += 1) {
    const payload = await api(
      `/accounts/${account}/pages/projects/${project}/deployments?env=preview&page=${page}&per_page=${PER_PAGE}`,
      { token }
    );
    deployments.push(...payload.result);

    const total = payload.result_info?.total_count;
    if (payload.result.length < PER_PAGE || (total && deployments.length >= total)) break;
  }
  return deployments;
}

function describe(deployment, ageDays) {
  const branch = deployment.deployment_trigger?.metadata?.branch || '(unknown)';
  const aliases = deployment.aliases?.length ? ` alias=${deployment.aliases.join(',')}` : '';
  return `${deployment.short_id || deployment.id.slice(0, 8)}  ${branch.padEnd(14)} ${String(ageDays).padStart(4)}d  ${deployment.url}${aliases}`;
}

function writeSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  require('fs').appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

async function main() {
  const { project, maxAgeDays, keep, dryRun } = parseArgs();
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!project || !token || !account) {
    console.error('❌ Need --project plus CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.');
    process.exit(2);
  }
  if (!Number.isFinite(maxAgeDays) || maxAgeDays < 0) {
    console.error(`❌ --max-age-days must be a non-negative number, got "${maxAgeDays}".`);
    process.exit(2);
  }

  console.log(`🔎 Project ${project} · deleting preview deployments older than ${maxAgeDays}d`);
  if (keep.size > 0) console.log(`   Protected branches: ${[...keep].join(', ')}`);
  if (dryRun) console.log('   DRY RUN — nothing will be deleted\n');
  else console.log('');

  const deployments = await listAllDeployments({ account, project, token });
  const now = Date.now();
  const ageOf = deployment =>
    Math.floor((now - new Date(deployment.created_on).getTime()) / 86400000);

  const stale = [];
  const kept = [];
  for (const deployment of deployments) {
    if (deployment.environment !== 'preview') continue;
    const branch = deployment.deployment_trigger?.metadata?.branch || '';
    const ageDays = ageOf(deployment);

    if (keep.has(branch)) kept.push({ deployment, ageDays, why: 'open PR' });
    else if (ageDays < maxAgeDays) kept.push({ deployment, ageDays, why: 'recent' });
    else stale.push({ deployment, ageDays });
  }

  console.log(`Found ${deployments.length} preview deployment(s): ${stale.length} stale, ${kept.length} kept\n`);

  for (const { deployment, ageDays, why } of kept) {
    console.log(`  keep    ${describe(deployment, ageDays)}  (${why})`);
  }

  let deleted = 0;
  const failures = [];
  for (const { deployment, ageDays } of stale) {
    if (dryRun) {
      console.log(`  WOULD DELETE ${describe(deployment, ageDays)}`);
      continue;
    }
    try {
      await api(
        `/accounts/${account}/pages/projects/${project}/deployments/${deployment.id}?force=true`,
        { token, method: 'DELETE' }
      );
      deleted += 1;
      console.log(`  deleted ${describe(deployment, ageDays)}`);
    } catch (error) {
      failures.push(`${deployment.short_id || deployment.id}: ${error.message}`);
      console.log(`  FAILED  ${describe(deployment, ageDays)}\n          ${error.message}`);
    }
  }

  const verb = dryRun ? 'would delete' : 'deleted';
  const count = dryRun ? stale.length : deleted;
  console.log(`\n${failures.length > 0 ? '⚠️' : '✅'} ${verb} ${count} deployment(s), kept ${kept.length}`);

  writeSummary([
    `### Preview deployment prune${dryRun ? ' (dry run)' : ''}`,
    '',
    `- Project: \`${project}\``,
    `- Retention: ${maxAgeDays} days`,
    `- Found: ${deployments.length} · ${verb}: ${count} · kept: ${kept.length}`,
    ...(failures.length > 0 ? ['', '**Failures**', '', ...failures.map(f => `- ${f}`)] : []),
  ]);

  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} deletion(s) failed`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
