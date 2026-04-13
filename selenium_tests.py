import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import time
import random
import string

def random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

class ExamineAITests(unittest.TestCase):
    BASE_URL = "https://software-project-82976.web.app/"
    
    # Store credentials across tests to allow login tests later
    test_email = f"test_student_{random_string()}@example.com"
    test_password = "password123"

    @classmethod
    def setUpClass(cls):
        options = webdriver.ChromeOptions()
        options.add_argument('--start-maximized')
        cls.driver = webdriver.Chrome(options=options)
        cls.driver.implicitly_wait(5)
        cls.wait = WebDriverWait(cls.driver, 10)

    @classmethod
    def tearDownClass(cls):
        time.sleep(2)  # final pause for video recording
        cls.driver.quit()

    def setUp(self):
        # We don't want to reload the page on EVERY single test if we want to maintain the dashboard state
        # So we only reload for the first 20 public tests.
        test_name = self._testMethodName
        if int(test_name.split("_")[1]) <= 20:
            self.driver.get(self.BASE_URL)
            time.sleep(1) # Slow down for video recording

    def tearDown(self):
        time.sleep(1) # Slow down test ends for video recording

    # --- 1. Landing Page Tests ---

    def test_01_landing_page_title(self):
        self.assertIn("ExamineAI", self.driver.title)

    def test_02_landing_page_logo_present(self):
        logo = self.driver.find_element(By.CLASS_NAME, "logo-text")
        self.assertTrue(logo.is_displayed())

    def test_03_features_section_present(self):
        features_section = self.driver.find_element(By.ID, "features")
        self.assertTrue(features_section.is_displayed())

    def test_04_how_it_works_section_present(self):
        how_it_works = self.driver.find_element(By.ID, "how-it-works")
        self.assertTrue(how_it_works.is_displayed())

    def test_05_footer_presence(self):
        footer = self.driver.find_element(By.CLASS_NAME, "landing-footer")
        self.assertTrue(footer.is_displayed())

    def test_06_theme_toggle_on_landing(self):
        theme_toggle = self.driver.find_element(By.CSS_SELECTOR, "nav .btn-icon")
        theme_toggle.click()
        time.sleep(1) # Let user see theme change
        theme_toggle.click() # Click again to revert

    # --- 2. Navigation Tests ---

    def test_07_navigation_to_login(self):
        login_btn = self.driver.find_element(By.XPATH, "//a[contains(@href, '/login') and contains(@class, 'btn-ghost')]")
        login_btn.click()
        time.sleep(1)
        self.assertIn("/login", self.driver.current_url)

    def test_08_navigation_to_register(self):
        register_btn = self.driver.find_element(By.XPATH, "//a[contains(@href, '/register') and contains(@class, 'btn-primary')]")
        register_btn.click()
        time.sleep(1)
        self.assertIn("/register", self.driver.current_url)

    def test_09_unauthenticated_dashboard_redirect(self):
        self.driver.get(self.BASE_URL + "dashboard")
        time.sleep(1)
        self.assertNotIn("/dashboard", self.driver.current_url)

    # --- 3. Login Page Tests ---

    def navigate_to_login(self):
        self.driver.get(self.BASE_URL + "login")
        self.wait.until(EC.visibility_of_element_located((By.ID, "login-email")))
        time.sleep(1)

    def test_10_login_page_elements_present(self):
        self.navigate_to_login()
        email_input = self.driver.find_element(By.ID, "login-email")
        self.assertTrue(email_input.is_displayed())

    def test_11_login_empty_form_validation(self):
        self.navigate_to_login()
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        time.sleep(1)
        email_input = self.driver.find_element(By.ID, "login-email")
        self.assertTrue(self.driver.execute_script("return arguments[0].required;", email_input))

    def test_12_password_visibility_toggle_login(self):
        self.navigate_to_login()
        password_input = self.driver.find_element(By.ID, "login-password")
        toggle_btn = self.driver.find_element(By.CSS_SELECTOR, "button.input-action")
        password_input.send_keys("hunter2")
        time.sleep(1)
        toggle_btn.click() # Show
        time.sleep(1)
        toggle_btn.click() # Hide

    def test_13_login_back_button(self):
        self.navigate_to_login()
        back_btn = self.driver.find_element(By.XPATH, "//a[contains(@class, 'btn-ghost') and contains(text(), 'Back')]")
        back_btn.click()
        time.sleep(1)
        self.assertEqual(self.driver.current_url, self.BASE_URL)

    def test_14_login_to_register_link(self):
        self.navigate_to_login()
        create_link = self.driver.find_element(By.XPATH, "//a[contains(@href, '/register')]")
        self.driver.execute_script("arguments[0].click();", create_link)
        time.sleep(1)
        self.assertIn("/register", self.driver.current_url)

    # --- 4. Register Page Tests ---

    def navigate_to_register(self):
        self.driver.get(self.BASE_URL + "register")
        self.wait.until(EC.visibility_of_element_located((By.ID, "register-name")))
        time.sleep(1)

    def test_15_register_page_elements_present(self):
        self.navigate_to_register()
        name_input = self.driver.find_element(By.ID, "register-name")
        self.assertTrue(name_input.is_displayed())

    def test_16_register_role_selection_toggle(self):
        self.navigate_to_register()
        teacher_btn = self.driver.find_element(By.XPATH, "//button[contains(@class, 'role-option')]//span[text()='Teacher']/..")
        teacher_btn.click()
        time.sleep(1)
        notice = self.wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "role-notice")))
        self.assertTrue(notice.is_displayed())

    def test_17_register_password_visibility_toggle(self):
        self.navigate_to_register()
        toggle_btn = self.driver.find_element(By.CSS_SELECTOR, "button.input-action")
        toggle_btn.click()
        time.sleep(0.5)

    def test_18_register_empty_form_validation(self):
        self.navigate_to_register()
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        time.sleep(1)
        name_input = self.driver.find_element(By.ID, "register-name")
        self.assertTrue(self.driver.execute_script("return arguments[0].required;", name_input))

    def test_19_register_back_button(self):
        self.navigate_to_register()
        back_btn = self.driver.find_element(By.XPATH, "//a[contains(@class, 'btn-ghost') and contains(text(), 'Back')]")
        back_btn.click()
        time.sleep(1)
        self.assertEqual(self.driver.current_url, self.BASE_URL)

    def test_20_register_to_login_link(self):
        self.navigate_to_register()
        login_link = self.driver.find_element(By.XPATH, "//a[contains(@href, '/login')]")
        self.driver.execute_script("arguments[0].click();", login_link)
        time.sleep(1)
        self.assertIn("/login", self.driver.current_url)

    # --- 5. Logged In Scenarios (Test 21-30) ---

    def test_21_register_student(self):
        """Creates a real test student account in Firebase and logs in"""
        self.driver.get(self.BASE_URL + "register")
        time.sleep(2)
        
        self.driver.find_element(By.ID, "register-name").send_keys("Test Student")
        time.sleep(0.5)
        self.driver.find_element(By.ID, "register-email").send_keys(self.test_email)
        time.sleep(0.5)
        self.driver.find_element(By.ID, "register-password").send_keys(self.test_password)
        time.sleep(0.5)
        self.driver.find_element(By.ID, "register-confirm").send_keys(self.test_password)
        time.sleep(0.5)
        
        # Student role is selected by default
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Wait for Firebase auth to create user and navigate to dashboard
        time.sleep(5)
        self.wait.until(lambda d: "/dashboard" in d.current_url or "/student" in d.current_url)
        time.sleep(2)

    def test_22_student_dashboard_sidebar(self):
        """Verifies the dashboard layout was hydrated for student"""
        # Could be redirected to /student index
        if "/student" not in self.driver.current_url:
            self.driver.get(self.BASE_URL + "student")
            time.sleep(2)
        sidebar = self.driver.find_element(By.CLASS_NAME, "sidebar")
        self.assertTrue(sidebar.is_displayed())
        time.sleep(1)

    def test_23_student_classrooms_nav(self):
        classroom_link = self.driver.find_element(By.CSS_SELECTOR, "a.sidebar-link[href*='/student/classrooms']")
        self.driver.execute_script("arguments[0].click();", classroom_link)
        time.sleep(2)
        self.assertIn("/student/classrooms", self.driver.current_url)

    def test_24_student_tests_nav(self):
        tests_link = self.driver.find_element(By.CSS_SELECTOR, "a.sidebar-link[href*='/student/tests']")
        self.driver.execute_script("arguments[0].click();", tests_link)
        time.sleep(2)
        self.assertIn("/student/tests", self.driver.current_url)

    def test_25_student_study_hub_nav(self):
        study_link = self.driver.find_element(By.CSS_SELECTOR, "a.sidebar-link[href*='/student/study-hub']")
        self.driver.execute_script("arguments[0].click();", study_link)
        time.sleep(2)
        self.assertIn("/student/study-hub", self.driver.current_url)

    def test_26_student_results_nav(self):
        results_link = self.driver.find_element(By.CSS_SELECTOR, "a.sidebar-link[href*='/student/results']")
        self.driver.execute_script("arguments[0].click();", results_link)
        time.sleep(2)
        self.assertIn("/student/results", self.driver.current_url)

    def test_27_student_logout(self):
        """Clicks profile dropdown and signs out"""
        header_profile = self.driver.find_element(By.CLASS_NAME, "header-profile")
        header_profile.click() # Open dropdown
        time.sleep(1)
        
        logout_btn = self.driver.find_element(By.XPATH, "//button[contains(., 'Sign Out')]")
        logout_btn.click()
        
        # Wait for logout / redirect (app redirects to /login after logout)
        time.sleep(3)
        self.assertTrue(
            self.driver.current_url == self.BASE_URL or "/login" in self.driver.current_url,
            f"Expected landing or login page, got: {self.driver.current_url}"
        )

    def test_28_login_with_created_user(self):
        """Uses the credentials from test_21 to log back in"""
        self.driver.get(self.BASE_URL + "login")
        time.sleep(1)
        
        self.driver.find_element(By.ID, "login-email").send_keys(self.test_email)
        time.sleep(0.5)
        self.driver.find_element(By.ID, "login-password").send_keys(self.test_password)
        time.sleep(0.5)
        
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        time.sleep(4) # Wait for firebase auth & redirect
        self.wait.until(lambda d: "/dashboard" in d.current_url or "/student" in d.current_url)
        
    def test_29_protected_admin_route_blocked(self):
        """Verifies students cannot access admin routes"""
        self.driver.get(self.BASE_URL + "admin")
        time.sleep(2)
        # Should redirect back to somewhat non-admin route (student or dashboard or public)
        self.assertNotIn("/admin", self.driver.current_url)

    def test_30_student_logout_again(self):
        """Cleans up the active session"""
        self.driver.get(self.BASE_URL + "student")
        time.sleep(3)
        
        # Scroll to top and click profile dropdown
        header_profile = self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "header-profile")))
        self.driver.execute_script("arguments[0].scrollIntoView(true);", header_profile)
        time.sleep(0.5)
        self.driver.execute_script("arguments[0].click();", header_profile)
        time.sleep(1.5)
        
        # Try finding the Sign Out button
        try:
            logout_btn = self.wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Sign Out')]")))
            self.driver.execute_script("arguments[0].click();", logout_btn)
        except Exception:
            # Fallback: click profile again to open dropdown then try again
            self.driver.execute_script("arguments[0].click();", header_profile)
            time.sleep(1)
            logout_btn = self.driver.find_element(By.XPATH, "//button[contains(., 'Sign Out')]")
            self.driver.execute_script("arguments[0].click();", logout_btn)
        time.sleep(2)

if __name__ == "__main__":
    unittest.main(verbosity=2)
