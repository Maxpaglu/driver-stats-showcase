from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time, os, traceback, datetime

BASE_URL = "http://localhost:8080/"
FAILED_TESTS = []
SCREENSHOT_DIR = os.path.join(os.getcwd(), "selenium_fail_screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def fail(label, error="", driver=None):
    print(f"\n❌ {label} FAILED → {error}")
    FAILED_TESTS.append(label)
    if driver:
        save_failure_artifacts(label, driver)

def save_failure_artifacts(label, driver):
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_label = "".join(c if c.isalnum() else "_" for c in label)[:60]
    png = os.path.join(SCREENSHOT_DIR, f"{safe_label}_{ts}.png")
    html = os.path.join(SCREENSHOT_DIR, f"{safe_label}_{ts}.html")
    try:
        driver.save_screenshot(png)
        with open(html, "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print(f"Saved screenshot: {png}")
        print(f"Saved page source: {html}")
    except Exception as e:
        print("Failed to save artifacts:", e)

def find_driver_cards(driver):
    """
    New robust card locator:
    - Each card root contains classes 'rounded-lg' and 'group' in your markup.
    - Use that to locate cards reliably.
    """
    return driver.find_elements(By.CSS_SELECTOR, "div.rounded-lg.group")

def wait_for_any_driver_name_matching(driver, query, timeout=6):
    """
    Poll for an h3 (driver name) whose text contains query (case-insensitive).
    Returns list of matching elements (could be empty).
    """
    end = time.time() + timeout
    q = query.lower()
    while time.time() < end:
        elems = driver.find_elements(By.CSS_SELECTOR, "div.rounded-lg.group h3")
        matches = [e for e in elems if q in e.text.lower()]
        if matches:
            return matches
        time.sleep(0.3)
    # final attempt: return empty list
    return []

def test_homepage(driver):
    label = "Homepage Load (After Login)"
    try:
        driver.get(BASE_URL)
        print("Opening", BASE_URL)

        # wait for login form to appear
        WebDriverWait(driver, 20).until(
            EC.visibility_of_element_located((By.ID, "username"))
        )
        print("Login form visible")

        # login
        driver.find_element(By.ID, "username").clear()
        driver.find_element(By.ID, "username").send_keys("yash1")
        driver.find_element(By.ID, "password").clear()
        driver.find_element(By.ID, "password").send_keys("yashmv1")
        driver.find_element(By.XPATH, "//button[contains(text(),'Login')]").click()
        print("Clicked Login")

        # Wait for hero heading or season heading to show up (longer wait)
        WebDriverWait(driver, 25).until(
            EC.visibility_of_element_located(
                (By.XPATH, "//h1[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'f1')] | //h2[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'season standings')]")
            )
        )

        # Also wait for at least one card to be present in grid (ensures content loaded)
        WebDriverWait(driver, 25).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div.container div.grid"))
        )

        # final sanity: ensure at least one visible card exists
        cards = find_driver_cards(driver)
        visible = [c for c in cards if c.is_displayed()]
        if not visible:
            raise Exception("No visible driver cards found after login/homepage load")
        print(f"✅ {label} - Found {len(visible)} visible driver card(s)")
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_search(driver, query, label):
    try:
        # ensure search input exists and is visible
        search_input = WebDriverWait(driver, 12).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, ".search-input"))
        )
        # clear & type (this triggers React onChange)
        search_input.clear()
        search_input.send_keys(query)
        print(f"Typed search query: '{query}'")

        # wait up to 6s for matches in the DOM (polling)
        matches = wait_for_any_driver_name_matching(driver, query, timeout=6)

        # Also capture overall visible card count for debug
        cards = find_driver_cards(driver)
        visible_count = sum(1 for c in cards if c.is_displayed())
        print(f"Total visible card roots found: {visible_count}")
        if matches:
            print(f"✅ {label}: Found {len(matches)} matching driver name(s). Example text: '{matches[0].text}'")
            return
        # if query should produce no results, check for "No drivers found" message
        if query.lower().startswith("invalid") or query.lower() == "abcdef":
            no_msg = driver.find_elements(By.XPATH, "//p[contains(text(),'No drivers found') or contains(.,'No drivers')]")
            if no_msg:
                print(f"✅ {label}: No-results message present")
                return
            else:
                fail(label, "Expected no-results message but it was not present", driver)
                return

        # fallback fail with diagnostics
        debug_texts = [e.text for e in driver.find_elements(By.CSS_SELECTOR, "div.rounded-lg.group h3")]
        fail(label, f"No matching driver found for '{query}'. Visible driver names: {debug_texts[:10]}", driver)
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_season_switch(driver, season):
    label = f"Season Switch {season}"
    try:
        # Buttons are simple <button> elements containing just the year text.
        btn = WebDriverWait(driver, 12).until(
            EC.element_to_be_clickable((By.XPATH, f"//button[normalize-space()='{season}' or contains(., '{season}')]"))
        )
        btn.click()
        print(f"Clicked season button: {season}")

        # Wait until grid content updates: wait for at least one visible card
        end = time.time() + 10
        while time.time() < end:
            cards = find_driver_cards(driver)
            visible = [c for c in cards if c.is_displayed()]
            if visible:
                print(f"✅ {label}: Found {len(visible)} visible cards after switch")
                return
            time.sleep(0.4)

        # final diagnostic
        fail(label, "No visible driver cards after season switch", driver)
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_chart_render(driver):
    label = "Chart Render Check"
    try:
        # Chart(s) are rendered as svg under recharts wrappers; wait for at least one SVG
        svg = WebDriverWait(driver, 12).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div.recharts-wrapper svg, svg.recharts-surface"))
        )
        if svg.is_displayed():
            print(f"✅ {label}")
        else:
            raise Exception("SVG found but not visible")
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_comparison_page(driver):
    label = "Comparison Page"
    try:
        # Compare button at top: "Compare Drivers" in your code (button)
        btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Compare') or contains(., 'Compare Drivers')]"))
        )
        btn.click()
        print("Clicked Compare button")
        WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, "//h1[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'head to head') or contains(., 'Head to Head')]"))
        )
        # check charts
        charts = driver.find_elements(By.CSS_SELECTOR, ".recharts-wrapper")
        if charts and any(c.is_displayed() for c in charts):
            print(f"✅ {label}: Found {len(charts)} chart wrapper(s)")
        else:
            raise Exception("No visible charts on comparison page")
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_mobile_responsive(driver):
    label = "Mobile Responsive Layout"
    try:
        driver.set_window_size(420, 850)
        time.sleep(1)
        cards = find_driver_cards(driver)
        visible = [c for c in cards if c.is_displayed()]
        if visible:
            print(f"✅ {label}: {len(visible)} visible cards in mobile size")
        else:
            raise Exception("No visible cards in mobile size")
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def run_tests():
    chrome_options = Options()
    # comment out next line to see browser UI while debugging
    # chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--start-maximized")
    driver = webdriver.Chrome(options=chrome_options)

    try:
        test_homepage(driver)

        test_search(driver, "Max", "Search Max")
        test_search(driver, "ver", "Search Partial")
        

        test_season_switch(driver, "2022")
        test_season_switch(driver, "2023")
        test_season_switch(driver, "2024")

        test_chart_render(driver)
        test_comparison_page(driver)
        test_mobile_responsive(driver)

    finally:
        print("\n\n================ TEST SUMMARY ================")
        if FAILED_TESTS:
            print(" Failed tests:")
            for t in FAILED_TESTS:
                print(" -", t)
            
        else:
            print("✅ All tests passed!")
        print("=============================================\n")
        driver.quit()

if __name__ == "__main__":
    run_tests()
