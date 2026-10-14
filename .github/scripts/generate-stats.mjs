import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import statsHandler from '../../stats-generator/api/index.js';
import langsHandler from '../../stats-generator/api/top-langs.js';

const username = 'sezgynus';
const output = resolve('activity-dist');
mkdirSync(output, { recursive: true });

async function generate(name, handler, query) {
  const headers = {};
  let svg = '';
  const res = {
    setHeader(key, value) { headers[key.toLowerCase()] = value; return this; },
    set(key, value) { return this.setHeader(key, value); },
    status() { return this; },
    send(value) { svg = String(value); return this; },
  };
  await handler({ query: { username, ...query } }, res);
  if (!svg.includes('<svg') || !svg.includes('</svg>') ||
      /Something went wrong|Could not resolve|Error Fetching|Bad credentials|rate limit|API rate limit/i.test(svg)) {
    throw new Error(`Invalid generated chart ${name}: ${svg.slice(0, 300)}`);
  }
  writeFileSync(resolve(output, name), svg);
  console.log(`Generated ${name} (${svg.length} bytes)`);
}

for (const [suffix, theme] of [['dark', 'dark'], ['light', 'default']]) {
  await generate(`stats-${suffix}.svg`, statsHandler, {
    show_icons: 'true',
    rank_icon: 'percentile',
    include_all_commits: 'true',
    theme,
    bg_color: '00000000',
    show: 'reviews,discussions_started,discussions_answered,prs_merged,prs_merged_percentage',
  });
  await generate(`languages-${suffix}.svg`, langsHandler, {
    size_weight: '0.5',
    count_weight: '0.5',
    layout: 'pie',
    theme,
    bg_color: '00000000',
    langs_count: '8',
    hide: 'g-code,batchfile',
  });
}
