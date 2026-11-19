"""Multiclass Planner checks for the shared smoke test (tools/smoke_test.py, STYLE.md 7).
run(page, base, check): page is a fresh Playwright page, base the site URL, check(cond, message) records a result."""
from pathlib import Path

SORCADIN = "?ed=2014&lv=PPPPPPSSSSSSSSSSSSSS&ab=15.8.14.8.10.16&sub=P.devotion,S.divine-soul&n=Sorcadin"


def run(page, base, check):
    def go(q=""):
        page.goto(base + q, wait_until="load")
        page.wait_for_timeout(500)

    # a build from a share link renders the table, the summary and the charts
    go(SORCADIN)
    check(page.locator("#tbody tr").count() == 20, "[planner] level table has 20 rows for a level-20 build")
    stats = page.locator("#stats").inner_text()
    check("Paladin 6" in stats and "Sorcerer 14" in stats, "[planner] summary shows the class split (Paladin 6 / Sorcerer 14)")
    check(page.evaluate("PlannerEngine.compute(PLANNER_DATA, {ed:'2014', levels: PlannerEngine.decodeLevels(PLANNER_DATA, 'PPPPPPSSSSSSSSSSSSSS'), ab:[15,8,14,8,10,16], sub:{}}).rows[19].casterLevel") == 17,
          "[planner] Paladin 6 / Sorcerer 14 is caster level 17")
    check(page.locator("#slotChart svg").count() == 1 and page.locator("#hpChart svg").count() == 1, "[planner] slot and hit point charts render")

    # the share link round-trips: the address it writes loads the same build
    q1 = page.evaluate("location.search")
    go(q1)
    check(page.evaluate("location.search") == q1, "[planner] a build's share link loads the same build")

    # class counters and the 3-class limit
    page.locator("[data-step='sorcerer'][data-d='-1']").click()
    page.wait_for_timeout(700)  # the level total tweens (DndUI.count)
    check("lv=PPPPPPSSSSSSSSSSSSS&" in page.evaluate("location.search") and "Level 19 / 20" in page.locator("#split").inner_text(),
          "[planner] a class counter changes the build and the level total")
    page.select_option("#addCls", "warlock")
    page.wait_for_timeout(200)
    check(page.locator("#addCls").is_disabled(), "[planner] after three classes, Add a class is disabled (3-class limit)")
    check(page.locator("[data-lv='2'] option[value='druid']").get_attribute("disabled") is not None, "[planner] a fourth class is disabled in the level grid")

    # Save as character adds the build to the shared characters
    go(SORCADIN)
    page.evaluate("localStorage.removeItem('dnd.characters')")
    go(SORCADIN)
    page.locator("#charBtn").click()
    page.wait_for_timeout(300)
    check(page.evaluate("DndChar.all().some(c => c.name === 'Sorcadin')"), "[planner] Save as character adds the build to DndChar.all()")
    check(page.evaluate("(() => { const a = DndChar.active(); return !!(a && a.sheet && a.sheet['dnd-multiclass-planner'] && a.sheet['dnd-multiclass-planner'].lvl === 20); })()"),
          "[planner] the character gets a sheet summary at level 20")

    # D&D Beyond import from pasted character data (made-up fixture)
    fixture = Path(__file__).resolve().parents[1] / "tools" / "fixtures" / "ddb-sample.json"
    if fixture.exists():
        go(SORCADIN)
        page.locator("#ddbBtn").click()
        page.fill("#ddbJson", fixture.read_text(encoding="utf-8"))
        page.locator("#ddbGo").click()
        page.wait_for_timeout(300)
        check(page.locator("#importNote").is_visible(), "[planner] D&D Beyond paste import shows its notes")
        check("lv=PPWWWSSSSF" in page.evaluate("location.search"), "[planner] D&D Beyond import builds the levels (starting class first)")
    page.evaluate("localStorage.clear()")
