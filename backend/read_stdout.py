import os
import sys

try:
    fd = os.open('/proc/17302/fd/1', os.O_RDONLY | os.O_NONBLOCK)
    # Read up to 1MB of content
    content = b""
    while True:
        try:
            chunk = os.read(fd, 65536)
            if not chunk:
                break
            content += chunk
        except BlockingIOError:
            break
    print(content.decode('utf-8', errors='ignore')[-2000:])
except Exception as e:
    print("Error reading stdout:", e)

try:
    fd2 = os.open('/proc/17302/fd/2', os.O_RDONLY | os.O_NONBLOCK)
    content2 = b""
    while True:
        try:
            chunk = os.read(fd2, 65536)
            if not chunk:
                break
            content2 += chunk
        except BlockingIOError:
            break
    print("--- STDERR ---")
    print(content2.decode('utf-8', errors='ignore')[-2000:])
except Exception as e:
    print("Error reading stderr:", e)
