# SPOKES 0.1.0 — 29 October 2026

## Local software validation

- 62 vendored assets match their pinned revision, size and SHA-256.
- Actual worker adapters successfully build from official Model:Cycles OS 1.13, SHA-256 `44fe586269631a0ca7da25a3383fc6733c314809505fc3cc52f1e0ed9800640c`.
- Modded Cycles additionally receives the user's official Syntakt OS. Its MAIN OS matches upstream `82a79f453151cbaceffdd047a646c96721f3ae3849a28f7821928bfbd4a1cca9`, with every individual mod reference checked.
- Model-TG MAIN OS matches upstream `a049d7246a0a55d56b574a807802d81258c7affc29a739252a08f25be29e99f8`.
- Motor's own patch kit verifies its stock, intermediate builds and final package.
- PPPCCC's full set matches published MAIN OS `995978244f98bd5a429418c098e6d05dadc0dcaf19c28a1218ec6816ad85a729`.
- Model27's default SAMPLE composition builds and passes the container signature and transport checks. Mixed feature combinations are experimental, not exhaustively tested.
- Output `.syx` SHA-256 values:

| Build | SHA-256 |
|---|---|
| Stock | `44fe586269631a0ca7da25a3383fc6733c314809505fc3cc52f1e0ed9800640c` |
| Model-TG | `d4646147aa160257ffc51e3454fcf2b42222cf9110c94b9d9073acdac0092080` |
| Motor:Cycles | `2476bc0240d6e4d29fb1deadb2356cc3d0348e2c181e332591395640213c3f1c` |
| Model27 SAMPLE | `ba674fac087dc7924cbb91ee3fddaefa06cbd1a1ec359daba477bcc56be75521` |
| PPPCCC full set | `22d0246fa09ce52e691fb08c0755dc867c26bae5e4af80ce181292d50a9fa519` |

All outputs were checked in memory; no built or official firmware files are included in this repository.

## UI and browser checks

- Invalid firmware rejected by every build adapter.
- Signed-image verifier accepts a local signed fixture byte-for-byte, rejects a mismatched supplied hash, and rejects corruption even when the supplied hash matches the corrupted file.
- Simulated MIDI: wrong Model:Samples identity sends no firmware; successful transfer closes its session and clears consent; cancellation reports an incomplete update; disconnects restore controls and close the session.
- Firmware switches invalidate the previous output and consent. Required OS files, Model27 options, PPPCCC selections, search and French text checked.
- Motor:Cycles built successfully in the local browser with the real official stock input.
- Model Tweaks and elekloader author-hosted pages load in the embedded frame. elekloader lists Model:Cycles OS 1.13.

## Limits

No hardware was flashed or tested. Browser/MIDI simulations and successful builds are not hardware compatibility claims. Model27 combinations and PPPCCC subsets are not exhaustive hardware tests. Plaits' documented integration branch was unavailable (404); no integrated builder is offered. David Caruso's specific TG/Plaits release has no verified source yet. Author-hosted installers are live upstream content, not pinned SPOKES builds.

## Résumé français

Les adaptateurs construisent les firmwares depuis l'OS officiel fourni, avec signatures et références vérifiées. Les tests MIDI utilisent des ports simulés. Motor:Cycles a aussi été construit dans le navigateur. Aucun appareil n'a été flashé ou testé. Les combinaisons Model27/PPPCCC restent expérimentales ; Plaits nécessite les outils externes et la version précise de David Caruso attend une source vérifiée.
