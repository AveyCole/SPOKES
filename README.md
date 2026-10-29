# SPOKES

[Open the flasher](https://aveycole.github.io/SPOKES/) · [Validation and limits](VALIDATION.md)

A community firmware picker and browser flasher for Elektron Model:Cycles. Choose one firmware at a time, build locally from your own official OS, then save or install.

Un sélecteur communautaire et programme de mise à jour pour Elektron Model:Cycles. Choisissez un firmware, construisez-le localement depuis votre OS officiel, puis enregistrez ou installez.

## Available paths / Parcours proposés

| Project / Projet | Integration / Intégration | Source |
|---|---|---|
| Motor:Cycles | Local browser builder / Construction locale | [nzimas/motorcycles](https://github.com/nzimas/motorcycles) |
| Model-TG 1.1.0 | Local browser builder / Construction locale | [TinyGregAudio/Model-TG](https://github.com/TinyGregAudio/Model-TG) |
| Modded Cycles 2.0 | Local browser builder; requires the user's official Syntakt OS too / Construction locale, nécessite aussi l'OS Syntakt officiel | [18nelli18/Modded-Cycles](https://github.com/18nelli18/Modded-Cycles) |
| Model27 | Local machine composer: SAMPLE, Digital Delay, POTS, Control All Config / Composition locale | [durchgemacht/model27](https://github.com/durchgemacht/model27) |
| PPPCCC 2.1.0 | Local selectable mods; dependencies added automatically / Mods locaux sélectionnables, dépendances automatiques | [gialloinfuso/PPPCCC-M-S-Mods](https://github.com/gialloinfuso/PPPCCC-M-S-Mods) |
| Stock OS 1.13 | Validates and restores the user's original file / Vérifie et restaure le fichier officiel fourni | [Elektron](https://www.elektron.se/support-downloads/modelcycles) |
| A.V. Supermodel | Existing local installer embedded on request, Full/Lite and Optional link / Programme existant intégré à la demande | [AveyCole/Supermodel](https://github.com/AveyCole/Supermodel) |
| Model Tweaks | Author-hosted installer embedded on request; separate-tab fallback / Programme du créateur intégré à la demande, lien de secours | [drumkilla/elektron-model-tweaks](https://github.com/drumkilla/elektron-model-tweaks) |
| elekloader | Author-hosted mod loader embedded on request; select the correct device there / Chargeur du créateur intégré à la demande | [elekloader/elekloader](https://github.com/elekloader/elekloader) (redirect from `irpina/elekloader`) |
| Plaits on Models | External command-line build, then optional local verification; upstream installation instructions apply / Compilation externe, puis vérification locale facultative | [DMDaudio/plaits-on-models](https://github.com/DMDaudio/plaits-on-models) |
| David Caruso TG/Plaits | Specific source not verified; no build or installation enabled / Source exacte non vérifiée ; construction et installation désactivées | Awaiting an authoritative link / Lien authentique requis |

Plaits' documented `DMDaudio/Modded-Cycles` integration branch returned HTTP 404 on 29 October 2026. No browser recipe is invented for it. This project is distinct from TinyGregAudio's Model-TG and from the unverified David Caruso build.

La branche d'intégration `DMDaudio/Modded-Cycles` documentée par Plaits renvoyait HTTP 404 le 29 octobre 2026. Aucune recette de navigateur n'est inventée. Ce projet est distinct de Model-TG et de la version David Caruso non vérifiée.

Embedded external installers are live upstream pages, not pinned hub builds. Their authors control the versions and supported devices. An external service can prevent framing or MIDI permissions; the explicit installer link remains available. Only the integrated builders and supplied-file verifier share this hub's transfer controls. The hub's own build files stay local; embedded pages follow their authors' behavior.

Les programmes externes intégrés sont les pages actuelles des créateurs, pas des constructions épinglées du hub. Leurs créateurs contrôlent les versions et les appareils. Un service peut bloquer l'intégration ou MIDI ; le lien explicite reste disponible. Seuls les constructeurs intégrés et le vérificateur de fichier partagent les contrôles de transfert du hub. Les fichiers construits par le hub restent locaux ; les pages externes suivent le comportement de leurs créateurs.

## Run locally / Lancer localement

From the repository root / Depuis la racine du dépôt :

```sh
node serve.mjs
```

Open / Ouvrez <http://127.0.0.1:8769/>. Use HTTPS in production. Workers need an HTTP(S) origin; browser builds do not run from `file://`. Chrome/Edge support MIDI; building and saving do not require MIDI access. The preview server binds only to `127.0.0.1` and serves `docs/`.

Utilisez HTTPS en production. Les workers nécessitent HTTP(S), pas `file://`. Chrome/Edge prennent en charge MIDI ; la construction et l'enregistrement ne nécessitent pas MIDI. Le serveur écoute uniquement `127.0.0.1` et sert `docs/`.

## Verification / Vérification

```sh
node test.mjs [path/to/model-cycles_OS1.13.syx] [path/to/Syntakt_OS1.42.syx]
```

Without stock files: checks pinned asset hashes, catalogue consistency, upstream references, invalid-file rejection, and acceptance/corruption rejection of the existing local signed Supermodel fixture. With official files: runs the actual worker adapters and verifies their output containers/signatures; Motor and TG retain their upstream result checks; Modded Cycles checks individual mods and its full MAIN OS reference; PPPCCC's full set must match `995978244f98bd5a429418c098e6d05dadc0dcaf19c28a1218ec6816ad85a729`. A PPPCCC subset has per-write checks but no published whole-output reference.

Sans fichiers officiels : empreintes des sources, cohérence du catalogue, références, rejet des fichiers invalides et vérification d'une image signée locale existante. Avec les fichiers officiels : exécution des adaptateurs réels et vérification des signatures. Les références complètes des projets sont conservées ; un sous-ensemble PPPCCC ne dispose que des contrôles de chaque écriture.

`test-ui.cjs` requires `jsdom` resolvable from `node_modules/jsdom`. It simulates MIDI and build replies to test wrong-device refusal, cancellation, disconnect cleanup, selection invalidation, required input files, translations and search. It never communicates with hardware.

`test-ui.cjs` utilise `jsdom` dans le dossier de dépendances de test indiqué. Il simule MIDI et les réponses de construction pour vérifier les refus et l'état de l'interface, sans communiquer avec du matériel.

## Updating sources / Actualiser les sources

`sync-upstream.mjs` downloads only explicitly pinned revisions. Review and change its revision together with `catalogue.js`; run it, then run tests. `vendor/manifest.json` records each source path, full commit, size and SHA-256. No automatic upgrade to a moving `main` branch. Never add official or built `.syx`, OS archives, extracted firmware sections or user assets.

`sync-upstream.mjs` télécharge uniquement les révisions explicitement épinglées. Mettez sa révision et celle du catalogue à jour ensemble, puis exécutez les tests. `vendor/manifest.json` consigne les sources et empreintes. Aucune mise à jour automatique depuis une branche mouvante. N'ajoutez jamais de firmware officiel ou construit ni d'extrait de firmware.

Discovery sources supplied by the owner / Sources indiquées par le propriétaire : [18nelli18](https://github.com/18nelli18), [durchgemacht](https://github.com/durchgemacht), [AveyCole](https://github.com/AveyCole), [TinyGregAudio](https://github.com/TinyGregAudio), [Motor:Cycles](https://github.com/nzimas/motorcycles), [drumkilla](https://github.com/drumkilla), [elekloader](https://github.com/irpina/elekloader), plus PPPCCC's repository above.

## Credits and licenses / Crédits et licences

The hub uses the repository's MIT license. Unmodified upstream files retain their own notices:

Le hub utilise la licence MIT du dépôt. Les fichiers des projets conservent leurs notices :

- [Motor:Cycles MIT](vendor/motor/LICENSE), [third-party notices](vendor/motor/third-party-notices/README.md).
- [Model-TG MIT](vendor/tg/LICENSE), [drumkilla MIT](vendor/tg/tweaks/LICENSE-elektron-model-tweaks).
- [Modded Cycles MIT](vendor/mc/LICENSE), [third-party notices](vendor/mc/THIRD-PARTY-NOTICES.md); the adjacent `vendor/mc/docs/flasher/LICENSE-*.txt` contain the component licenses.
- [Model27 MIT](vendor/model27/LICENSE), [third-party notices](vendor/model27/THIRD-PARTY-NOTICES.md); the adjacent `vendor/model27/docs/flasher/LICENSE-*.txt` contain the component licenses.
- [PPPCCC MIT](vendor/pppccc/LICENSE), [third-party notices](vendor/pppccc/THIRD-PARTY-NOTICES.md). `pppccc.js` ports its original [apply_patches.py](vendor/pppccc/tools/apply_patches.py); original instructions are read from the user's file only.
- The shared [MIDI transfer core](vendor/mc/docs/flasher/flasher.js) is unchanged, with [firmware-tool](vendor/mc/docs/flasher/LICENSE-elektron-firmware-tool.txt), [model-tweaks](vendor/mc/docs/flasher/LICENSE-elektron-model-tweaks.txt) and [ms-multi-output](vendor/mc/docs/flasher/LICENSE-ms-multi-output.txt) credits.
- elekloader is linked/embedded, not copied into this hub. Its upstream GPL license and notices remain with its installer. The same applies to drumkilla's live `.elemod` installer and its elekloader components.

The hub targets Model:Cycles, not cross-flashing. The fast method identifies the device before transmitting firmware. Classic MIDI requires the user to choose the correct physical destination. Some large packages contain transport bytes Web MIDI rejects as classic SysEx; those are refused before the first message, with Fast/upstream instructions offered instead.

Le hub cible Model:Cycles, sans conversion d'appareil. Le mode rapide identifie l'appareil avant l'envoi. En mode classique, vous devez choisir le bon port physique. Certains gros fichiers ne sont pas acceptés en SysEx classique ; le hub refuse alors l'envoi avant le premier message.

Back up projects and samples before switching. [Elektron's recovery instructions](https://support.elektron.se/support/solutions/articles/43000662701-how-to-update-your-device-via-sysex-transfer): STARTUP MENU recovery uses physical MIDI IN, not USB. Integration testing does not establish hardware compatibility or project compatibility between firmwares. PPPCCC reports testing on Model:Samples running the Cycles OS, not Model:Cycles; Plaits reports emulation without hardware confirmation.

Sauvegardez les projets et échantillons. La récupération STARTUP MENU utilise MIDI IN physique, pas USB. Les tests d'intégration ne prouvent pas la compatibilité matérielle ou celle des projets entre firmwares. PPPCCC rapporte des tests sur Model:Samples avec l'OS Cycles ; Plaits rapporte l'émulation sans confirmation matérielle.
