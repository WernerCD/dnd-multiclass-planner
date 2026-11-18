# Multiclass Planner

Plan D&D 5e multiclass builds of **up to three classes** level by level, for the **2014** and **2024** rules. Covered so far: Paladin, Warlock, Sorcerer, Druid and Barbarian (more classes are being added; levels in other classes are kept as locked levels).

**Live:** https://wernercd.github.io/dnd-multiclass-planner/ · part of the [D&D Toolbox](https://wernercd.github.io/dnd/) · [Changes](https://wernercd.github.io/dnd-multiclass-planner/changes.html)

## Features
- Pick the rules edition, then set levels per class (1-20 in total; builds can stop below 20). Only the classes in the build show a counter; "Add a class" adds another, up to three classes (a fourth choice is refused with the reason, in the counters, the level grid and Fill; at level 20 a new class takes over your last level). The level-order grid underneath sets which class is taken at each character level. Changing a count keeps the order and adds or removes that class's levels at the end.
- Ability scores with multiclass prerequisite warnings: Paladin needs Str 13 and Cha 13; Warlock and Sorcerer Cha 13; Barbarian Str 13; Druid Wis 13.
- Class resources from the class data: Rage count and damage, Wild Shape uses and highest beast CR (Circle of the Moon included), Lay on Hands, Channel Divinity, sorcery points, Metamagic, invocations. Spell save DC and attack per casting class (Druid uses Wisdom).
- Subclass pickers that open at the right class level (2024 moves the Sorcerer and Warlock picks to level 3), plus the 2014 Pact Boon.
- A level-by-level table: proficiency bonus, features with short original summaries, multiclass ASIs/feats, Extra Attack (and the note that it doesn't stack), hit points.
- **Spell slots** from the multiclass spellcaster table, counting Paladin as a half caster with each edition's rounding (2014: down, and only from paladin 2; 2024: up). A single Spellcasting class uses its own table.
- **Pact Magic kept separate**, with Mystic Arcanum, and notes on how it combines: pact slots fuel smites, Font of Magic turns them into sorcery points, and warlock levels never add to the caster level.
- Spells known or prepared per class, cantrips, highest spell level each class can learn, invocations, metamagic, sorcery points, Lay on Hands and Channel Divinity.
- A summary at any level (slider), milestones, build-specific combination notes, a 2024 changes panel and rules notes.
- Saved builds in the browser (`localStorage`), and the whole build in the share link: `?ed=2014&lv=PPPPPPSSSSSSSSSSSSSS&ab=15.8.14.8.10.16&sub=P.devotion,S.divine-soul`.
- Presets, listed for the selected rules only: Sorcadin (2014 and 2024), Hexadin (2014 and 2024), Sorlock, Coffeelock (flagged as a 2014 exploit), Sorlockadin and Moon Barbarian (2014 and 2024).
- **Import from D&D Beyond.** D&D Beyond's character service sends no CORS headers, so the page can't fetch it directly. Instead the user pastes their character link, opens the generated `character-service.dndbeyond.com/character/v5/character/<id>` link (public characters, or their own while signed in), copies the JSON and pastes it back. `site/ddb.js` reads the Paladin/Warlock/Sorcerer levels (starting class first, since D&D Beyond doesn't store level order; other classes are kept as locked levels, first when one is the starting class), subclasses, ability scores (base + racial/background/class/feat bonuses, no items) and name, and guesses the edition from the subclass names and the 2024 PHB source id. Nothing is sent anywhere or kept apart from the resulting build.
- **Shared characters** (`site/character.js`, the shared D&D Toolbox store `dnd.characters`). "Save as character" turns the build into a character (name, rules, classes with levels and subclasses in the order first taken, ability scores) with the full planner link under `links['dnd-multiclass-planner']`. The build stays linked (`charId`), so edits update the same character after a 500 ms pause (or on blur). Classes the planner doesn't model show as locked levels (counted for level, proficiency, hit points, Extra Attack and caster level; `OTHER_CLASSES` in `data.js`), and subclasses it doesn't list are kept as "other". Neither is ever dropped from the shared record. Switching characters never replaces an unsaved build, edits made elsewhere while you're editing ask which version to keep, and a saved build whose character has moved on loads unlinked. Picking a character in the header, or arriving with `?char=<id>`, loads it. Buttons hand it to the Spell Planner and Item Finder (and Wild Shape when it has druid levels). Share links (character.js `#dndchar=`) carry the build too: every shared save also calls `DndChar.setShare()` with the build query, and when a share is accepted, `DndChar.takeInbox()` hands it back. The planner loads it if this browser has no build for that character (or the same one) and nothing unsaved would be lost; otherwise it asks.
- Print gives a clean build sheet: class levels, summary, milestones and the level table, without the controls.

## Data and copyright
The repo and site are public, so no book text is reproduced. Every feature and subclass description is a short original summary. Subclasses outside the SRD (Hexblade, Divine Soul, Clockwork Soul, Oath of Vengeance and others) are listed by name, book and level with a one-line summary only.

## Layout
| Path | What |
|---|---|
| `site/` | The static site (HTML/CSS/vanilla JS, no build step) |
| `site/data.js` | Paladin, Warlock and Sorcerer data, presets, `OTHER_CLASSES` (locked-level fallback) and `MAX_CLASSES` |
| `site/data-classes.js` | More classes (Barbarian, Druid), loaded before `data.js`. Add a class here: unique one-letter `code`, `caster`, `castAbil`, `extraAttack`, per-edition features, subclasses and `res` (resources), then add its id to `ORDER` |
| `site/engine.js` | The rules engine (pure functions, also loaded by Node) |
| `site/app.js` | The page: rendering, saved builds, share links |
| `site/ddb.js` | D&D Beyond import parser (also loaded by Node) |
| `site/theme.js` | Shared D&D Toolbox theme toggle (`dnd.theme`) |
| `site/changes.html` | Change log |
| `site/404.html` | Page-not-found page (absolute links; Pages serves it at any missing path) |
| `site/character.js` | Shared characters across the D&D Toolbox sites (header switcher, `dnd.characters`) |
| `site/version.js` | Shared update notice (offers a reload when a newer build is live) |
| `tools/fixtures/ddb-sample.json` | Made-up D&D Beyond character used by the import checks |
| `tools/check.js` | Spot checks of the slot math against the multiclass spellcaster table, the D&D Beyond import and the character conversion |
| `tools/check_site.py` | Shared toolbox smoke check (pages, head tags, header/footer, local links) |

## Run locally
```bash
python -m http.server 8771 --directory site
```
Checks (CI runs the same before every deploy): `python tools/check_site.py` and `node tools/check.js`. Every push to `main` deploys to GitHub Pages via `.github/workflows/pages.yml`, which stamps asset links (`?v=dev`) with the commit id.

## Credits and license
- Code: MIT, see [LICENSE](LICENSE).
- This work includes material from the System Reference Document 5.1 and 5.2 by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document, licensed under the Creative Commons Attribution 4.0 International License (https://creativecommons.org/licenses/by/4.0/legalcode).
- Subclass and book names from other books are © Wizards of the Coast.
- Unofficial fan content. Not affiliated with or endorsed by Wizards of the Coast.
