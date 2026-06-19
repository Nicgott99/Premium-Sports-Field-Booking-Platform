import subprocess
import os
import smtplib
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

PROJECT_PATH = r"G:\Premium-Sports-Field-Booking-Platform"
EMAIL_SENDER = "hasibullah.khan.alvie@g.bracu.ac.bd"
EMAIL_PASSWORD = "তvacn uxsf bakp xhxd"
EMAIL_RECEIVER = "hasibullah.khan.alvie@g.bracu.ac.bd"

# কোন batch push করতে হবে সেটা argument হিসেবে নেবে
BATCH = sys.argv[1] if len(sys.argv) > 1 else "1"

def notify(message):
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_SENDER
        msg["To"] = EMAIL_RECEIVER
        msg["Subject"] = f"Scheduled Push — Batch {BATCH} Report"
        msg.attach(MIMEText(message, "plain"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, EMAIL_RECEIVER, msg.as_string())
        print("Email sent.")
    except Exception as e:
        print(f"Email failed: {e}")

def run(cmd):
    result = subprocess.run(
        cmd, cwd=PROJECT_PATH,
        text=True, encoding="utf-8",
        errors="replace", capture_output=True
    )
    print(result.stdout)
    print(result.stderr)
    return result.returncode

def main():
    print(f"Starting scheduled push — Batch {BATCH}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %I:%M %p')}")

    notify(f"Starting Batch {BATCH} push at {datetime.now().strftime('%I:%M %p')}")

    if BATCH == "1":
        # Batch 1: push শুধু প্রথম commit পর্যন্ত
        code = run(["git", "push", "origin", "0e21d4a:refs/heads/main"])
    elif BATCH == "2":
        # Batch 2: বাকি সব push করো
        code = run(["git", "push", "origin", "main"])
    else:
        print("Unknown batch!")
        return

    if code == 0:
        msg = (
            f"Batch {BATCH} pushed successfully!\n"
            f"Time: {datetime.now().strftime('%Y-%m-%d %I:%M %p')}\n"
            f"Check GitHub: https://github.com/Nicgott99/Premium-Sports-Field-Booking-Platform"
        )
    else:
        msg = f"Batch {BATCH} push FAILED!\nTime: {datetime.now().strftime('%Y-%m-%d %I:%M %p')}"

    print(msg)
    notify(msg)

if __name__ == "__main__":
    main()