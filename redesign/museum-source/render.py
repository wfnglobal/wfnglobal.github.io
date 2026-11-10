import asyncio, glob, os, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1500, "height": 1000})
        os.makedirs("raw", exist_ok=True)
        for f in sorted(glob.glob("svg/*.svg")):
            if len(sys.argv) > 1 and sys.argv[1] not in f: continue
            await pg.goto("file://" + os.path.abspath(f)); await pg.wait_for_timeout(150)
            await pg.screenshot(path="raw/" + os.path.basename(f)[:-4] + ".png")
        await b.close()
asyncio.run(main())
