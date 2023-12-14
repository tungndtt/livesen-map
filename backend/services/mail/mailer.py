import smtplib
from email.mime import text, multipart
from config import MAILER


__server = None


def init() -> None:
    global __server
    if __server is None:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()
        server.login(MAILER.email, MAILER.password)
        __server = server


def send_email(recipient: str, subject: str, content: str) -> bool:
    message = multipart.MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = MAILER.email
    message["To"] = recipient
    message.attach(text.MIMEText(content, "html"))
    try:
        __server.sendmail(MAILER.email, recipient, message.as_string())
        return True
    except Exception as error:
        print("[Email]", error)
        return False


if __name__ == "__main__":
    recipient = "tungdoan224@gmail.com"
    subject = "Livesen Map Testing Mail"
    content = """
    <html>
        <head></head>
        <body>
            <p>
                Dear
                <br><br>
                this is a testing mail from Livesen-Map utilizing <a href="https://www.google.com/gmail/about/">gmail</a>.
                <br><br>
                Best,
                <br>
                Livesen Map
            </p>
        </body>
    </html>
    """
    print(send_email(recipient, subject, content))
