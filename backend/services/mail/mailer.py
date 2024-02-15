import time
import schedule
from threading import Thread, Event
from smtplib import SMTP, SMTPAuthenticationError
from email.mime import text, multipart
from config import MAILER


__event = None
__thread = None
__server = None


def __init_connection():
    global __server
    retry = 20
    while retry > 0:
        try:
            server = SMTP("smtp.gmail.com", 587, timeout=10)
            server.ehlo()
            server.starttls()
            server.login(MAILER.email, MAILER.password)
            __server = server
            break
        except SMTPAuthenticationError:
            print("[Mailer]: Invalid credentials")
            break
        except Exception as error:
            print("[Mailer]", error)
        finally:
            retry -= 1
            time.sleep(1)


def __check_connection():
    global __server
    if __server is None:
        __init_connection()
    else:
        try:
            status = __server.noop()[0]
        except:
            status = -1
        if status != 250:
            __init_connection()


def __run_job():
    __check_connection()
    schedule.every(30).minutes.do(__check_connection)
    while __event.is_set():
        schedule.run_pending()
        time.sleep(4)


def init():
    global __event, __thread
    if __thread is None:
        __event = Event()
        __event.set()
        __thread = Thread(target=__run_job)
        __thread.start()


def term():
    global __server, __thread, __event
    if __server is not None:
        __server.quit()
    if __thread is not None:
        __event.clear()
        __thread.join()


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
        print("[Mailer]", error)
        return False


if __name__ == "__main__":
    try:
        init()
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
    except:
        pass
    finally:
        term()
