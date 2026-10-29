// Explicit, reviewed revisions only. Never downloads or distributes an Elektron OS.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sources = [
  ['motor', 'nzimas/motorcycles', 'd8468f64510216472c17a27f3ad3d82ff99bbef7', ['docs/patcher.js','docs/motorcycles.mcpatch','LICENSE','README.md']],
  ['tg', 'TinyGregAudio/Model-TG', '70b39dd6787770ebefc7a2d78dea1678ec012679', ['flasher/elektron.js','flasher/patch.js','flasher/model-tg.json','tweaks/model-cycles_OS1.13/01-latching-mute.json','LICENSE','README.md']],
  ['mc', '18nelli18/Modded-Cycles', '259441967e39b283e458e5027eda27c86a663562', ['docs/flasher/builder.js','docs/flasher/tweaks.js','docs/flasher/flasher.js','docs/flasher/app.js','LICENSE','THIRD-PARTY-NOTICES.md','README.md']],
  ['model27', 'durchgemacht/model27', 'da939aedb4f48cf4c11376431d4b58811fc87696', ['docs/flasher/builder.js','docs/flasher/composer.js','docs/flasher/tweaks.js','LICENSE','README.md']],
  ['pppccc', 'gialloinfuso/PPPCCC-M-S-Mods', 'c6d0176485baebc375ca5f97b30699b44aabe53e', ['patches/manifest.json',...['00-core','01-mute-solo','02-live-mute','03-hold-mute','04-delay-notes','05-reverb-fx','06-delay-fx','07-strum','08-load-meter','09-groove','10-control-mode','11-trig-select','12-fill2'].map(p=>`patches/${p}.json`),'tools/apply_patches.py','LICENSE','THIRD-PARTY-NOTICES.md','README.md']],
];
const root = new URL('./vendor/', import.meta.url);
const manifest = [];
for (const [id, repo, revision, paths] of sources) {
  const treeResponse=await fetch(`https://api.github.com/repos/${repo}/git/trees/${revision}?recursive=1`);
  if(!treeResponse.ok)throw Error(`Cannot read license inventory for ${repo}`);
  const tree=await treeResponse.json();
  const licenses=tree.tree.filter(f=>f.type==='blob'&&(/^(third-party-notices|docs\/flasher)\/.*(LICENSE|NOTICE)/.test(f.path)||/^(THIRD-PARTY-NOTICES.md|tweaks\/LICENSE-elektron-model-tweaks)$/.test(f.path))).map(f=>f.path);
  for (const path of [...new Set([...paths,...licenses])]) {
    if (/\.(syx|zip|wav)$/i.test(path)) throw Error('Firmware/media distribution forbidden');
    const url = `https://raw.githubusercontent.com/${repo}/${revision}/${path}`;
    const response = await fetch(url);
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
await writeFile(new URL('manifest.json', root), JSON.stringify({reviewed:'2026-10-29',files:manifest},null,2)+'\n');
console.log(`Pinned ${manifest.length} upstream files. Review changes before release.`);
