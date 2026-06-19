import subprocess
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

PROJECT_PATH = r"G:\Premium-Sports-Field-Booking-Platform"
EMAIL_SENDER = "hasibullah.khan.alvie@g.bracu.ac.bd"
EMAIL_PASSWORD = "vacn uxsf bakp xhxd"
EMAIL_RECEIVER = "hasibullah.khan.alvie@g.bracu.ac.bd"

COMMITS = {
    "20": "1bff9d9",
    "21": "c161831",
    "22": "9197e95",
    "23": "41f0d10",
    "24": "2d58e8e",
    "25": "bb0865d",
}

def notify(message):
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_SENDER
        msg["To"] = EMAIL_RECEIVER
        msg["Subject"] = "Daily Push Report"
        msg.attach(MIMEText(message, "plain"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, EMAIL_RECEIVER, msg.as_string())
        print("Email sent.")
    except Exception as e:
        print(f"Email failed: {e}")

def main():
    day = datetime.now().strftime("%d")
    print(f"Daily push running — Day: {day}")

    if day not in COMMITS:
        print(f"No commit scheduled for day {day}.")
        return

    commit = COMMITS[day]
    print(f"Pushing up to commit: {commit}")

    notify(f"Starting daily push for June {day} at {datetime.now().strftime('%I:%M %p')}")

    result = subprocess.run(
        ["git", "push", "origin", f"{commit}:refs/heads/main"],
        cwd=PROJECT_PATH,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace"
    )

    print(result.stdout)
    print(result.stderr)

    if result.returncode == 0:
        msg = (
            f"June {day} push SUCCESS!\n"
            f"Commit: {commit}\n"
            f"Time: {datetime.now().strftime('%I:%M %p')}\n"
            f"GitHub: https://github.com/Nicgott99/Premium-Sports-Field-Booking-Platform"
        )
    else:
        msg = (
            f"June {day} push FAILED!\n"
            f"Error: {result.stderr}\n"
            f"Time: {datetime.now().strftime('%I:%M %p')}"
        )

    print(msg)
    notify(msg)

if __name__ == "__main__":
    main()