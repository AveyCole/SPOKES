// Explicit, reviewed revisions only. Never downloads or distributes an Elektron OS.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const config=JSON.parse(await readFile(new URL(process.env.SPOKES_UPSTREAM_CONFIG||'./upstreams.json',import.meta.url),'utf8'));
const sources=config.sources.filter(s=>s.kind==='built-in').map(s=>[s.id,s.repo,s.revision,s.paths]);
const headers=process.env.GITHUB_TOKEN?{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`} : {};
const root = new URL(process.env.SPOKES_VENDOR_DEST||'./vendor/', import.meta.url);
const manifest = [];
for (const [id, repo, revision, paths] of sources) {
  const treeResponse=await fetch(`https://api.github.com/repos/${repo}/git/trees/${revision}?recursive=1`,{headers,signal:AbortSignal.timeout(30000)});
  if(!treeResponse.ok)throw Error(`Cannot read license inventory for ${repo}`);
  const tree=await treeResponse.json();
  const licenses=tree.tree.filter(f=>f.type==='blob'&&(/^(third-party-notices|docs\/flasher)\/.*(LICENSE|NOTICE)/.test(f.path)||/^(THIRD-PARTY-NOTICES.md|tweaks\/LICENSE-elektron-model-tweaks)$/.test(f.path))).map(f=>f.path);
  for (const path of [...new Set([...paths,...licenses])]) {
    if (/\.(syx|zip|wav)$/i.test(path)||path.startsWith('/')||path.split('/').includes('..')) throw Error('Firmware/media distribution or unsafe path forbidden');
    const url = `https://raw.githubusercontent.com/${repo}/${revision}/${path}`;
    const response = await fetch(url,{signal:AbortSignal.timeout(30000)});
    if (!response.ok) throw Error(`${response.status}: ${url}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const dest = `${id}/${path}`;
    await mkdir(new URL(`${id}/${path.split('/').slice(0,-1).join('/')}/`, root), {recursive:true});
    await writeFile(new URL(dest, root), bytes);
    manifest.push({path:dest,repo,revision,source:path,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
  }
}
// Preserve upstream's whole-build and individual-mod reference checks.
const app = await readFile(new URL('mc/docs/flasher/app.js', root), 'utf8');
const refs = {};
for (const name of ['REF_MAINOS','REF_MODS']) {
  const match = app.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`));
  if (!match) throw Error(`Missing upstream ${name}`);
  refs[name] = JSON.parse(match[1].replace(/^\s*\/\/.*$/gm, '').replace(/,\s*}/g, '}'));
}
await writeFile(new URL('mc/refs.json', root), JSON.stringify(refs,null,2)+'\n');
await writeFile(new URL('manifest.json', root), JSON.stringify({imported:new Date().toISOString().slice(0,10),files:manifest},null,2)+'\n');
console.log(`Pinned ${manifest.length} upstream files. Review changes before release.`);
