# -*- coding: utf-8 -*-
"""Build toàn bộ frontend: (1) sinh các file .html người dùng trong frontend/user/ từ tools/build/pages/*.py, (2) sinh các trang admin
trong frontend/admin/ từ tools/build/admin/pages/*.py.
Chạy từ thư mục gốc dự án:  python tools/build/build.py
(muốn build 1 trang:  python tools/build/pages/kham_pha.py)"""
import glob, os, runpy, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.stdout.reconfigure(encoding="utf-8")

for path in sorted(glob.glob(os.path.join(HERE, "pages", "*.py"))) + sorted(glob.glob(os.path.join(HERE, "admin", "pages", "*.py"))):
    runpy.run_path(path, run_name="__main__")

# frontend/index.html: cửa vào chung, chuyển thẳng tới web người dùng (user/) để mở thư mục frontend/ cũng chạy được
REDIRECT = """<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><title>Hôm Nay Ăn Gì?</title>
<meta http-equiv="refresh" content="0; url=user/index.html"><script>location.replace('user/index.html');</script></head>
<body><a href="user/index.html">Vào trang Hôm Nay Ăn Gì?</a></body></html>
"""
with open(os.path.join(ROOT, "frontend", "index.html"), "w", encoding="utf-8") as f:
    f.write(REDIRECT)
print("index.html: chuyển hướng tới user/index.html")
