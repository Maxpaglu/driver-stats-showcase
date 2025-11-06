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

def pass_test(label):
    print(f"✅ {label} PASSED")

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
    """Locate driver cards using the rounded-lg group classes"""
    return driver.find_elements(By.CSS_SELECTOR, "div.rounded-lg.group")

def wait_for_any_driver_name_matching(driver, query, timeout=6):
    """Poll for driver name h3 elements containing query"""
    end = time.time() + timeout
    q = query.lower()
    while time.time() < end:
        elems = driver.find_elements(By.CSS_SELECTOR, "div.rounded-lg.group h3")
        matches = [e for e in elems if q in e.text.lower()]
        if matches:
            return matches
        time.sleep(0.3)
    return []

def login(driver, username="Yash1", password="yashmv1"):
    """Common login function"""
    driver.get(BASE_URL)
    WebDriverWait(driver, 20).until(EC.visibility_of_element_located((By.ID, "username")))
    driver.find_element(By.ID, "username").clear()
    driver.find_element(By.ID, "username").send_keys(username)
    driver.find_element(By.ID, "password").clear()
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.XPATH, "//button[contains(text(),'Login')]").click()
    WebDriverWait(driver, 25).until(
        EC.visibility_of_element_located((By.XPATH, "//h2[contains(text(),'Season Standings')]"))
    )
    time.sleep(1)

def test_login_valid(driver):
    label = "TC01 - Login with valid credentials"
    try:
        login(driver)
        cards = find_driver_cards(driver)
        visible = [c for c in cards if c.is_displayed()]
        if not visible:
            raise Exception("No visible driver cards found after login")
        pass_test(label)
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)


def test_homepage_load(driver):
    label = "TC04 - Homepage Load"
    try:
        header = driver.find_element(By.XPATH, "//h1[contains(text(),'F1')]")
        assert header.is_displayed()
        pass_test(label)
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_search(driver, query, label):
    try:
        search_input = WebDriverWait(driver, 12).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, ".search-input"))
        )
        search_input.clear()
        search_input.send_keys(query)
        time.sleep(1)
        
        matches = wait_for_any_driver_name_matching(driver, query, timeout=6)
        cards = find_driver_cards(driver)
        visible_count = sum(1 for c in cards if c.is_displayed())
        
        if matches:
            pass_test(label)
        else:
            debug_texts = [e.text for e in driver.find_elements(By.CSS_SELECTOR, "div.rounded-lg.group h3")]
            fail(label, f"No matching driver for '{query}'. Found: {debug_texts[:5]}", driver)
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_invalid_search(driver):
    label = "TC07 - Search Invalid Driver"
    try:
        search = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".search-input"))
        )
        search.clear()
        search.send_keys("xyzinvaliddriver123")
        time.sleep(1)
        msg = driver.find_element(By.XPATH, "//p[contains(text(),'No drivers found')]")
        assert msg.is_displayed()
        pass_test(label)
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_season_switch(driver, season, tc_id):
    label = f"{tc_id} - Season Switch {season}"
    try:
        btn = WebDriverWait(driver, 12).until(
            EC.element_to_be_clickable((By.XPATH, f"//button[contains(text(), '{season}')]"))
        )
        btn.click()

        # Clear any active search filter to avoid zero results from previous tests
        try:
            search_input = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".search-input"))
            )
            search_input.clear()
        except Exception:
            pass

        # Wait for loading to finish (spinner disappears)
        try:
            WebDriverWait(driver, 8).until(
                EC.invisibility_of_element_located((By.CSS_SELECTOR, ".animate-spin"))
            )
        except Exception:
            pass

        # Verify season heading updates
        season_heading = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, f"//h2[contains(text(),'{season} Season Standings')]"))
        )

        # Wait until at least one driver card is visible
        WebDriverWait(driver, 10).until(
            lambda d: any(c.is_displayed() and c.size.get("height", 0) > 0 for c in find_driver_cards(d))
        )

        if season_heading.is_displayed():
            pass_test(label)
        else:
            fail(label, "Season heading not visible after switch", driver)
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_comparison_navigation(driver):
    label = "TC11 - Comparison Page Navigation"
    try:
        btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'Compare')]"))
        )
        btn.click()
        WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(),'Head to Head')]"))
        )
        pass_test(label)
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_charts(driver):
    label = "TC14 - Performance Metrics Chart"
    try:
        charts = WebDriverWait(driver, 12).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".recharts-wrapper"))
        )
        if charts and any(c.is_displayed() for c in charts):
            pass_test(label)
        else:
            fail(label, "No visible charts", driver)
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_mobile_responsive(driver):
    label = "TC16 - Mobile Responsive Layout"
    try:
        driver.set_window_size(420, 850)
        time.sleep(2)
        
        # Scroll to ensure cards are in viewport
        driver.execute_script("window.scrollTo(0, 300);")
        time.sleep(1)
        
        cards = find_driver_cards(driver)
        visible_cards = [c for c in cards if c.is_displayed() and c.size['height'] > 0]
        if visible_cards:
            pass_test(label)
        else:
            fail(label, "No visible cards in mobile view", driver)
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def test_logout(driver):
    label = "TC03 - Logout Functionality"
    try:
        driver.find_element(By.XPATH, "//button[contains(text(),'Logout')]").click()
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, "username")))
        pass_test(label)
    except Exception as e:
        fail(label, f"{e}\n{traceback.format_exc()}", driver)

def run_tests():
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    driver = webdriver.Chrome(options=chrome_options)

    try:
        # Login tests
        test_login_valid(driver)
        
        # Homepage and search tests
        test_homepage_load(driver)
        test_search(driver, "Max", "TC05 - Search Max Verstappen")
        test_search(driver, "ver", "TC06 - Search Partial")
        test_invalid_search(driver)
        
        # Season switch tests
        test_season_switch(driver, "2022", "TC08")
        test_season_switch(driver, "2023", "TC09")
        test_season_switch(driver, "2024", "TC10")
        
        # Navigation and charts
        test_comparison_navigation(driver)
        test_charts(driver)
        
        # Responsive design
        test_mobile_responsive(driver)
        
        # Logout test
        test_logout(driver)

    finally:
        print("\n\n============== ✅ TEST SUMMARY ✅ ==============")
        if FAILED_TESTS:
            print("\n❌ Tests Failed:")
            for t in FAILED_TESTS:
                print(" -", t)
        else:
            print("\n✅ All Tests Passed Successfully!")
        print("\n=============================================\n")
        driver.quit()

if __name__ == "__main__":
    run_tests()
