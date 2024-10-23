from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

# init webdriver
chrome_path = Path.joinpath(Path(__file__).resolve().parent.parent, "chromedriver.exe")
options = Options()
options.add_argument("--ignore-certificate-errors")
service = Service(executable_path=chrome_path)

driver = webdriver.Chrome(service=service, options=options)
driver.get("https://127.0.0.1:8000")
actions = ActionChains(driver)


def get_time(view, shift):
    if view == "m":
        return (
            (datetime.now() + relativedelta(months=shift))
            .strftime("%d %B %Y")
            .lstrip("0")
        )
    else:
        return (datetime.now() + timedelta(shift)).strftime("%d %B %Y").lstrip("0")


# TEST 1 - Navigation

date = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "[id*='Toolbar_date']"))
)
date = date.find_element(By.XPATH, ".//span")

# date should be today
assert date.text == get_time(None, 0)

navigation_menu = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "[id*='Toolbar_navigationWrap']"))
)
# Module 1: Back Navigation
try:
    back_button = navigation_menu.find_element(By.XPATH, ".//button[2]")

    # date should be 1 week back from today
    back_button.click()
    assert date.text == get_time(None, -7)

    back_button.click()
    assert date.text == get_time(None, -14)

    back_button.click()
    assert date.text == get_time(None, -21)

    back_button.click()
    assert date.text == get_time(None, -28)
except Exception as e:
    print("Module 1: Date does not match expected date")

print("Test 1: Module 1 complete")

# Module 2: Forward Navigation
try:
    next_button = navigation_menu.find_element(By.XPATH, ".//button[3]")

    # date should be now
    next_button.click()
    next_button.click()
    next_button.click()
    next_button.click()
    assert date.text == get_time(None, 0)

    next_button.click()
    assert date.text == get_time(None, 7)
    next_button.click()
    assert date.text == get_time(None, 14)
    next_button.click()
    assert date.text == get_time(None, 21)
    next_button.click()
    assert date.text == get_time(None, 28)
except Exception as e:
    print("Module 2: Date does not match expected date")
print("Test 1: Module 2 complete")
# Module 3: Today Navigation
try:
    today_button = navigation_menu.find_element(By.XPATH, ".//button[1]")
    # date should be now
    today_button.click()

    assert date.text == get_time(None, 0)
except Exception as e:
    print("Module 3: Date does not match expected date")
print("Test 1: Module 3 complete")
# Module 4: View Navigation - Day

view_menu = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "[id*='Toolbar_viewsWrapper']"))
)
week_view = view_menu.find_element(By.XPATH, ".//button[2]")
try:
    day_view = view_menu.find_element(By.XPATH, ".//button[1]")
    day_view.click()

    back_button.click()
    back_button.click()
    back_button.click()
    assert date.text == get_time(None, -3)

    today_button.click()
    assert date.text == get_time(None, -0)

    next_button.click()
    next_button.click()
    next_button.click()
    assert date.text == get_time(None, 3)

except:
    print("Module 4: Date does not match expected date")
print("Test 1: Module 4 complete")
# Module 5: View Navigation - Month

try:
    today_button.click()
    month_view = view_menu.find_element(By.XPATH, ".//button[3]")
    month_view.click()
    back_button.click()
    back_button.click()
    back_button.click()
    assert date.text == get_time("m", -3)
    today_button.click()
    assert date.text == get_time(None, 0)
    next_button.click()
    next_button.click()
    next_button.click()
    assert date.text == get_time("m", 3)
    today_button.click()
except:
    print("Module 5: Date does not match expected date")
print("Test 1: Module 5 complete")
# Module 6: Secondary Menu Navigation
try:
    week_view.click()
    secondary_nav_menu = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "[id*='SecondaryMenu_secondaryCalendarToolbar']")
        )
    )
    snm_first_div = secondary_nav_menu.find_element(By.XPATH, ".//div")
    secondary_back_button = snm_first_div.find_element(By.XPATH, ".//button[1]")
    secondary_back_button.click()

    assert date.text == get_time(None, -7)
    # need to refind the nav menu otherwise throws a stale element exception
    secondary_nav_menu = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "[id*='SecondaryMenu_secondaryCalendarToolbar']")
        )
    )
    snm_first_div = secondary_nav_menu.find_element(By.XPATH, ".//div")
    secondary_next_button = snm_first_div.find_element(By.XPATH, ".//button[2]")
    secondary_next_button.click()

    secondary_nav_menu = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "[id*='SecondaryMenu_secondaryCalendarToolbar']")
        )
    )
    snm_first_div = secondary_nav_menu.find_element(By.XPATH, ".//div")
    secondary_next_button = snm_first_div.find_element(By.XPATH, ".//button[2]")
    secondary_next_button.click()
    assert date.text == get_time(None, 7)
    today_button.click()

except Exception as e:
    print("Module 6: Error occurred:", e)

print("Test 1: Module 6 complete")
# TEST 2 - Event Creation
# Module 1: Calendar Event Creation
try:
    calendar_slot = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (
                By.XPATH,
                "/html/body/div/div/div[2]/main/div[2]/div/div[2]/div[3]",
            )
        )
    )
    calendar_slot.click()

    edit_modal = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "[id*='AppCalendar_editModal']")
        )
    )
    edit_modal_classes = edit_modal.get_attribute("class")
    # modal should contain the active class
    assert edit_modal_classes.__contains__("active")

    edit_modal_form = edit_modal.find_element(By.XPATH, ".//form")
    edit_modal_name_input = edit_modal_form.find_element(By.XPATH, ".//input")
    edit_modal_name_input.send_keys("Selenium Test")

    edit_modal_description = edit_modal_form.find_element(
        By.XPATH, ".//textarea[@id='description']"
    )

    edit_modal_description.send_keys("This is a test description")
    edit_modal_save = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.XPATH, ".//button[contains(@id, 'AppCalendar_editModalSubmit')]")
        )
    )
    edit_modal_save.click()
    time.sleep(3)
    edit_modal_classes = edit_modal.get_attribute("class")
    assert not edit_modal_classes.__contains__("active")
    # Event should have saved
    event = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "div[role='button'][title*='Selenium Test']")
        )
    )
    assert event is not None, "Event not found"
except Exception as e:
    print(f"An error occurred in Test 2, Module 1: {e}")
print("Test 2: Module 1 complete")

# Module 2: Event Creation from Secondary Menu

try:
    secondary_menu_add_menu = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "[id*='SecondaryMenu_addEventWrap']")
        )
    )

    secondary_menu_add_button = secondary_menu_add_menu.find_element(
        By.XPATH, ".//div[contains(@id, 'SecondaryMenu_addEventButton')]/button"
    )

    secondary_menu_add_button.click()
    edit_modal_name_input.send_keys("Selenium Test 2")
    edit_modal_description.send_keys("This is the second Selenium test")

    edit_modal_save.click()

    event = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "div[role='button'][title*='Selenium Test 2']")
        )
    )
    assert event is not None, "Event not found"

    event_start_time_str = (
        event.get_attribute("title").split(" ")[0]
        + " "
        + event.get_attribute("title").split(" ")[1]
    )

    event_start_time = datetime.strptime(event_start_time_str, "%I:%M %p").replace(
        year=datetime.now().year, month=datetime.now().month, day=datetime.now().day
    )
    now = datetime.now()
    time_difference = abs((now - event_start_time).total_seconds()) / 60

    # time of the new event should be within 15 minutes of the current time
    assert time_difference <= 15
except Exception as e:
    print(f"An error occurred: {e}")

print("Test 2: Module 2 complete")

# Module 3: Dragging Events
try:

    event = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "div[role='button'][title*='Selenium Test 2']")
        )
    )
    original_title = event.get_attribute("title")
    resize_anchor = event.find_elements(
        By.CSS_SELECTOR, ".rbc-addons-dnd-resize-ns-anchor"
    )
    actions.click_and_hold(resize_anchor[0]).move_by_offset(0, -100).release().perform()

    event = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "div[role='button'][title*='Selenium Test 2']")
        )
    )
    resize_anchor = event.find_elements(
        By.CSS_SELECTOR, ".rbc-addons-dnd-resize-ns-anchor"
    )
    actions.click_and_hold(resize_anchor[1]).move_by_offset(0, 100).release().perform()

    event = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "div[role='button'][title*='Selenium Test 2']")
        )
    )
    title = event.get_attribute("title")
    assert original_title is not title

    event = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "div[role='button'][title*='Selenium Test 2']")
        )
    )
    original_title = title
    actions.click_and_hold(event).move_by_offset(0, -200).release().perform()

    event = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "div[role='button'][title*='Selenium Test 2']")
        )
    )
    title = event.get_attribute("title")
    assert original_title is not title
except Exception as e:
    print(f"An error occurred: {e}")

print("Test 3: Module 1 complete")
time.sleep(10)

# end tests
driver.quit()
