import os
import time
import random
import string
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def main():
    folder_name = "screenshots_of_pages"
    os.makedirs(folder_name, exist_ok=True)
    descriptions_file = os.path.join(folder_name, "descriptions.txt")
    
    descriptions = []

    BASE_URL = "https://software-project-82976.web.app/"
    
    options = webdriver.ChromeOptions()
    options.add_argument('--headless=new')
    options.add_argument('--window-size=1440,900')
    
    print("Starting browser...")
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)
    
    try:
        # 1. Landing Page
        print("Navigating to landing page...")
        driver.get(BASE_URL)
        time.sleep(3)
        screenshot_path = os.path.join(folder_name, "01_landing_page.png")
        driver.save_screenshot(screenshot_path)
        descriptions.append("1. 01_landing_page.png: The ExamineAI landing page showing the main branding, features, and how it works.")

        # 2. Login Page
        print("Navigating to login page...")
        driver.get(BASE_URL + "login")
        wait.until(EC.visibility_of_element_located((By.ID, "login-email")))
        time.sleep(1)
        screenshot_path = os.path.join(folder_name, "02_login_page.png")
        driver.save_screenshot(screenshot_path)
        descriptions.append("2. 02_login_page.png: The login page where existing users can enter their credentials to access the platform.")

        # 3. Register Page & User Creation
        print("Navigating to register page...")
        driver.get(BASE_URL + "register")
        wait.until(EC.visibility_of_element_located((By.ID, "register-name")))
        time.sleep(1)
        screenshot_path = os.path.join(folder_name, "03_register_page.png")
        driver.save_screenshot(screenshot_path)
        descriptions.append("3. 03_register_page.png: The registration page where new users can sign up as a Student or Teacher.")

        print("Registering a new student to access dashboard...")
        test_email = f"test_student_{random_string()}@example.com"
        driver.find_element(By.ID, "register-name").send_keys("Test Student")
        driver.find_element(By.ID, "register-email").send_keys(test_email)
        driver.find_element(By.ID, "register-password").send_keys("password123")
        driver.find_element(By.ID, "register-confirm").send_keys("password123")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Wait for dashboard
        time.sleep(6)
        wait.until(lambda d: "/dashboard" in d.current_url or "/student" in d.current_url)

        # 4. Dashboard
        print("Capturing dashboard...")
        time.sleep(2)
        screenshot_path = os.path.join(folder_name, "04_student_dashboard.png")
        driver.save_screenshot(screenshot_path)
        descriptions.append("4. 04_student_dashboard.png: The main student dashboard displaying an overview of recent activity and quick links.")

        print("Capturing classrooms...")
        # 5. Classrooms
        classroom_link = driver.find_element(By.CSS_SELECTOR, "a.sidebar-link[href*='/student/classrooms']")
        driver.execute_script("arguments[0].click();", classroom_link)
        time.sleep(2)
        screenshot_path = os.path.join(folder_name, "05_student_classrooms.png")
        driver.save_screenshot(screenshot_path)
        descriptions.append("5. 05_student_classrooms.png: The classrooms page displaying all the classrooms the student is enrolled in.")

        print("Capturing tests...")
        # 6. Tests
        tests_link = driver.find_element(By.CSS_SELECTOR, "a.sidebar-link[href*='/student/tests']")
        driver.execute_script("arguments[0].click();", tests_link)
        time.sleep(2)
        screenshot_path = os.path.join(folder_name, "06_student_tests.png")
        driver.save_screenshot(screenshot_path)
        descriptions.append("6. 06_student_tests.png: The tests page showing upcoming, available, and past examinations.")

        print("Capturing study hub...")
        # 7. Study Hub
        study_link = driver.find_element(By.CSS_SELECTOR, "a.sidebar-link[href*='/student/study-hub']")
        driver.execute_script("arguments[0].click();", study_link)
        time.sleep(3)
        screenshot_path = os.path.join(folder_name, "07_student_study_hub.png")
        driver.save_screenshot(screenshot_path)
        descriptions.append("7. 07_student_study_hub.png: The AI-powered Study Hub where students can chat with the AI assistant and upload PDFs.")

        print("Capturing results...")
        # 8. Results
        results_link = driver.find_element(By.CSS_SELECTOR, "a.sidebar-link[href*='/student/results']")
        driver.execute_script("arguments[0].click();", results_link)
        time.sleep(2)
        screenshot_path = os.path.join(folder_name, "08_student_results.png")
        driver.save_screenshot(screenshot_path)
        descriptions.append("8. 08_student_results.png: The results analytics page showing the student's performance metrics and grades.")

    except Exception as e:
        print(f"Error occurred: {e}")

    finally:
        print("Writing descriptions and exiting...")
        with open(descriptions_file, "w") as f:
            f.write("\n".join(descriptions))
        
        driver.quit()
        print("Done.")

if __name__ == "__main__":
    main()
