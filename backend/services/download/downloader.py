import schedule
import time
import multiprocessing
import requests
import os
import datetime
import pytz
from config import DOWNLOADER


__process = None


def __date_extract():
    logfile_path = os.path.join(DOWNLOADER.data_folder, "logfile.log")
    if os.path.exists(logfile_path):
        with open(logfile_path) as logfile:
            timestamp = logfile.readline()
    else:
        timestamp = "20200701"
    year, month, day = timestamp[:4], timestamp[4:6], timestamp[6:]
    return logfile_path, (year, month, day)


def __product_download():
    logfile_path, (year, month, day) = __date_extract()
    timezone = pytz.timezone("Europe/Berlin")
    timestamp = datetime.datetime(
        year=int(year), month=int(month), day=int(day), tzinfo=timezone
    )
    forced_termination = False
    while timestamp < datetime.datetime.now(timezone):
        product = f"{year}{month}{day}"
        product_path = os.path.join(DOWNLOADER.data_folder, f"{product}.nc")
        if not os.path.exists(product_path):
            temp_product_path = os.path.join(
                DOWNLOADER.data_folder, f"temp_{product}.nc")
            position = 0
            if os.path.exists(temp_product_path):
                mode = "ab"
                position = os.path.getsize(temp_product_path)
            else:
                mode = "wb"
            data_exists = True
            url = f"https://{DOWNLOADER.user}:{DOWNLOADER.password}@land.copernicus.vgt.vito.be/PDF/datapool/Vegetation/Indicators/NDVI_300m_V2/{year}/{month}/{day}/NDVI300_{product}0000_GLOBE_OLCI_V2.0.1/c_gls_NDVI300_{product}0000_GLOBE_OLCI_V2.0.1.nc"
            # Send an HTTP GET request and stream the response content
            with open(temp_product_path, mode) as writer:
                # iterate over the response content in chunks
                counter = 0
                # chunk of 4 MB
                chunk_size = 4 * 1024 * 1024
                while True:
                    try:
                        connection_broken = False
                        start_position = position + counter * chunk_size
                        response = requests.get(
                            url, stream=True,
                            headers={"Range": f"bytes={start_position}-"}
                        )
                        content_type = response.headers.get("content-type")
                        if response.status_code < 400 and content_type == "application/octet-stream":
                            for chunk in response.iter_content(chunk_size=chunk_size):
                                # Process the chunk of data
                                writer.write(chunk)
                                counter += 1
                        elif content_type != "application/octet-stream":
                            data_exists = False
                            break
                    except KeyboardInterrupt:
                        print("[Downloader] Interrupt the download")
                        forced_termination = True
                        break
                    except Exception as error:
                        print("[Downloader]", error)
                        connection_broken = True
                    finally:
                        # close the response to release resources
                        response.close()
                        if not connection_broken:
                            break
            if not data_exists:
                os.remove(temp_product_path)
            elif not forced_termination:
                os.rename(temp_product_path, product_path)
            if forced_termination:
                break
        timestamp += datetime.timedelta(days=1)
        year = "%04d" % timestamp.year
        month = "%02d" % timestamp.month
        day = "%02d" % timestamp.day
        with open(logfile_path, "w") as logfile:
            logfile.write(f"{year}{month}{day}")


def __run_job():
    try:
        __product_download()
        schedule.every(10).days.do(__product_download)
        while True:
            schedule.run_pending()
            time.sleep(24 * 60 * 60)
    except:
        print("[Downloader] Stop downloading process")


def init():
    if not DOWNLOADER.is_downloading:
        return
    global __process
    if not os.path.isdir(DOWNLOADER.data_folder):
        os.mkdir(DOWNLOADER.data_folder)
    if __process is None:
        __process = multiprocessing.Process(target=__run_job)
        __process.start()


def term():
    global __process
    if __process is not None:
        __process.terminate()


if __name__ == "__main__":
    try:
        init()
    except:
        pass
    finally:
        term()
