"""Real Chrome browser regression against exact staged public mobile flow files."""
import functools
import http.server
import os
from pathlib import Path
import shutil
import threading
import unittest

from playwright.sync_api import sync_playwright, expect

ROOT=Path(os.environ.get("MOBILE_DEMO_ROOT") or Path(__file__).resolve().parents[1]).resolve()

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):
        pass

class MobileFlowBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        browser_path=os.environ.get("BROWSER_EXECUTABLE") or next(
            (p for name in ("google-chrome","chromium","chromium-browser")
             if (p:=shutil.which(name))),None)
        if not browser_path:
            raise RuntimeError("CHROME_REQUIRED_NO_SKIP")
        cls.engine=sync_playwright().start()
        cls.browser=cls.engine.chromium.launch(
            executable_path=browser_path,headless=True,
            args=["--no-sandbox","--disable-dev-shm-usage","--disable-background-networking"])
        cls.server=http.server.ThreadingHTTPServer(("127.0.0.1",0),
            functools.partial(QuietHandler,directory=str(ROOT)))
        cls.worker=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.worker.start()
        cls.origin=f"http://127.0.0.1:{cls.server.server_port}"
        print("Observed Chrome:",cls.browser.version,flush=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.engine.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.worker.join(timeout=5)

    def setUp(self):
        self.context=self.browser.new_context(viewport={"width":375,"height":812})
        self.addCleanup(self.context.close)
        self.external=[]
        self.script_errors=[]
        def local_only(route):
            if route.request.url.startswith(self.origin+"/"):
                route.continue_()
            else:
                self.external.append(route.request.url)
                route.abort()
        self.context.route("**/*",local_only)
        self.page=self.context.new_page()
        self.page.on("pageerror",lambda err:self.script_errors.append(str(err)))
        self.page.goto(self.origin)
        expect(self.page.locator("#progress")).to_have_text("Step 1 of 3")

    def tearDown(self):
        self.assertEqual(self.external,[],"No third-party or network activity")
        self.assertEqual(self.script_errors,[],"No browser script errors")

    def test_guarded_journey_focus_back_and_reset(self):
        self.page.locator("#next").click()
        expect(self.page.locator("#error")).to_contain_text("Select a template")
        expect(self.page.locator('input[name="template"]').first).to_be_focused()
        expect(self.page.locator("#progress")).to_have_text("Step 1 of 3")
        self.page.locator('input[value="booking"]').check()
        self.page.locator("#next").click()
        expect(self.page.locator("#progress")).to_have_text("Step 2 of 3")
        expect(self.page.locator('[data-panel="1"] h2')).to_be_focused()
        self.page.locator("#journey-label").fill("x")
        self.page.locator("#next").click()
        expect(self.page.locator("#error")).to_contain_text("between 3 and 50")
        expect(self.page.locator("#journey-label")).to_be_focused()
        self.page.locator("#journey-label").fill("Fictional support booking")
        self.page.locator("#next").click()
        expect(self.page.locator("#progress")).to_have_text("Step 3 of 3")
        expect(self.page.locator("#selected-template")).to_have_text("Booking flow")
        expect(self.page.locator("#selected-label")).to_have_text("Fictional support booking")
        self.page.locator("#back").click()
        expect(self.page.locator("#journey-label")).to_have_value("Fictional support booking")
        self.page.locator("#next").click()
        self.page.locator("#next").click()
        expect(self.page.locator("#progress")).to_have_text("Journey complete")
        expect(self.page.locator("#next")).to_be_hidden()
        self.page.locator("#restart").click()
        expect(self.page.locator("#progress")).to_have_text("Step 1 of 3")
        expect(self.page.locator('input[value="booking"]')).not_to_be_checked()

    def test_320px_to_desktop_layout_and_no_hidden_panels_in_tab_order(self):
        for width,height in ((320,700),(375,812),(768,1024),(1440,900)):
            with self.subTest(width=width):
                self.page.set_viewport_size({"width":width,"height":height})
                metrics=self.page.evaluate("""() => ({
                  page:document.documentElement.scrollWidth,
                  viewport:innerWidth,
                  selected:document.querySelectorAll('[data-panel]:not([hidden])').length,
                  main:document.querySelectorAll('main').length,
                  controls:[...document.querySelectorAll('.actions button:not([hidden])')].every(x=>x.getBoundingClientRect().height>=44)
                })""")
                self.assertLessEqual(metrics["page"],metrics["viewport"])
                self.assertEqual(metrics["selected"],1)
                self.assertEqual(metrics["main"],1)
                self.assertTrue(metrics["controls"])

if __name__=="__main__":
    unittest.main(verbosity=2)
