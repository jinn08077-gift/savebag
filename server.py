from html import unescape
from html.parser import HTMLParser
from http import cookies
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import base64
import hashlib
import hmac
import ipaddress
import json
import mimetypes
import secrets
import socket
import time
import urllib.error
import urllib.request


ROOT = Path(__file__).resolve().parent
MAX_BYTES = 2_000_000
DATA_DIR = ROOT / ".savedbag_data"
USER_DB = DATA_DIR / "users.json"
SESSION_SECONDS = 60 * 60 * 24 * 30
PASSWORD_ITERATIONS = 240_000
SESSIONS = {}


class PageTextParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.skip_depth = 0
        self.in_title = False
        self.title_parts = []
        self.meta = {}
        self.chunks = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        tag = tag.lower()
        self.stack.append(tag)

        if tag in {"script", "style", "svg", "noscript", "template"}:
            self.skip_depth += 1
        if tag == "title":
            self.in_title = True
        if tag == "meta":
            key = (attrs.get("property") or attrs.get("name") or "").lower()
            value = attrs.get("content") or ""
            if key in {"description", "og:title", "og:description", "twitter:title", "twitter:description"}:
                self.meta[key] = clean_text(value)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "title":
            self.in_title = False
        if tag in {"script", "style", "svg", "noscript", "template"} and self.skip_depth:
            self.skip_depth -= 1

        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        text = clean_text(data)
        if not text or self.skip_depth:
            return
        if self.in_title:
            self.title_parts.append(text)
            return

        content_tags = {"article", "main", "section", "p", "li", "blockquote", "h1", "h2", "h3"}
        if any(tag in content_tags for tag in self.stack) or len(text) >= 80:
            self.chunks.append(text)

    def result(self):
        title = clean_text(
            self.meta.get("og:title")
            or self.meta.get("twitter:title")
            or " ".join(self.title_parts)
        )
        description = clean_text(
            self.meta.get("og:description")
            or self.meta.get("twitter:description")
            or self.meta.get("description")
        )
        return {
            "title": title,
            "description": description,
            "text": dedupe_chunks(self.chunks),
        }


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        parsed_path = urlparse(self.path).path
        if parsed_path == "/api/register":
            self.handle_register()
            return
        if parsed_path == "/api/login":
            self.handle_login()
            return
        if parsed_path == "/api/logout":
            self.handle_logout()
            return
        if parsed_path != "/api/analyze":
            self.send_json({"ok": False, "reason": "未知接口"}, status=404)
            return
        if not current_session_user(self.headers):
            self.send_json({"ok": False, "reason": "请先登录"}, status=401)
            return

        try:
            payload = self.read_json_body()
            url = payload.get("url", "")
            result = analyze_url(url)
            self.send_json(result)
        except Exception as exc:
            self.send_json({"ok": False, "reason": f"解析失败：{exc}"}, status=500)

    def do_GET(self):
        parsed_path = urlparse(self.path).path
        if parsed_path == "/api/session":
            self.handle_session()
            return

        if parsed_path.startswith("/.savedbag_data"):
            self.send_error(404)
            return

        if parsed_path == "/":
            parsed_path = "/index.html"

        target = (ROOT / parsed_path.lstrip("/")).resolve()
        if not str(target).startswith(str(ROOT)) or not target.exists() or not target.is_file():
            self.send_error(404)
            return

        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, payload, status=200, headers=None):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(data)

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def handle_register(self):
        payload = self.read_json_body()
        username = normalize_username(payload.get("username", ""))
        password = str(payload.get("password", ""))

        if not username:
            self.send_json({"ok": False, "reason": "请输入账号"}, status=400)
            return
        if len(username) < 2 or len(username) > 40:
            self.send_json({"ok": False, "reason": "账号需要 2-40 个字符"}, status=400)
            return
        if len(password) < 6:
            self.send_json({"ok": False, "reason": "密码至少需要 6 位"}, status=400)
            return

        users = load_users()
        key = username.lower()
        if key in users:
            self.send_json({"ok": False, "reason": "这个账号已经注册过"}, status=409)
            return

        users[key] = {
            "username": username,
            "password": hash_password(password),
            "createdAt": int(time.time()),
        }
        save_users(users)
        token = create_session(username)
        self.send_json(
            {"ok": True, "user": public_user(username)},
            headers={"Set-Cookie": session_cookie(token)},
        )

    def handle_login(self):
        payload = self.read_json_body()
        username = normalize_username(payload.get("username", ""))
        password = str(payload.get("password", ""))

        users = load_users()
        record = users.get(username.lower())
        if not record or not verify_password(password, record.get("password", {})):
            self.send_json({"ok": False, "reason": "账号或密码不正确"}, status=401)
            return

        display_name = record.get("username") or username
        token = create_session(display_name)
        self.send_json(
            {"ok": True, "user": public_user(display_name)},
            headers={"Set-Cookie": session_cookie(token)},
        )

    def handle_logout(self):
        token = request_session_token(self.headers)
        if token:
            SESSIONS.pop(token, None)
        self.send_json(
            {"ok": True},
            headers={"Set-Cookie": session_cookie("", max_age=0)},
        )

    def handle_session(self):
        username = current_session_user(self.headers)
        self.send_json({"ok": True, "user": public_user(username) if username else None})


def load_users():
    if not USER_DB.exists():
        return {}
    try:
        data = json.loads(USER_DB.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def save_users(users):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temp_file = USER_DB.with_suffix(".tmp")
    temp_file.write_text(json.dumps(users, ensure_ascii=False, indent=2), encoding="utf-8")
    temp_file.replace(USER_DB)


def normalize_username(value):
    return clean_text(value).replace(" ", "")


def hash_password(password):
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return {
        "salt": base64.b64encode(salt).decode("ascii"),
        "hash": base64.b64encode(digest).decode("ascii"),
        "iterations": PASSWORD_ITERATIONS,
    }


def verify_password(password, stored):
    try:
        salt = base64.b64decode(stored.get("salt", ""))
        expected = base64.b64decode(stored.get("hash", ""))
        iterations = int(stored.get("iterations", PASSWORD_ITERATIONS))
    except (TypeError, ValueError):
        return False

    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(digest, expected)


def create_session(username):
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = {
        "username": username,
        "expiresAt": time.time() + SESSION_SECONDS,
    }
    return token


def current_session_user(headers):
    token = request_session_token(headers)
    if not token:
        return None
    session = SESSIONS.get(token)
    if not session:
        return None
    if session.get("expiresAt", 0) < time.time():
        SESSIONS.pop(token, None)
        return None
    return session.get("username")


def request_session_token(headers):
    raw_cookie = headers.get("Cookie", "")
    if not raw_cookie:
        return None
    cookie = cookies.SimpleCookie()
    cookie.load(raw_cookie)
    morsel = cookie.get("savedbag_session")
    return morsel.value if morsel else None


def session_cookie(token, max_age=SESSION_SECONDS):
    cookie = cookies.SimpleCookie()
    cookie["savedbag_session"] = token
    cookie["savedbag_session"]["path"] = "/"
    cookie["savedbag_session"]["max-age"] = str(max_age)
    cookie["savedbag_session"]["httponly"] = True
    cookie["savedbag_session"]["samesite"] = "Lax"
    return cookie.output(header="").strip()


def public_user(username):
    return {"username": username}


def analyze_url(url):
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return {"ok": False, "reason": "只支持 http/https 链接"}
    if is_blocked_host(parsed.hostname):
        return {"ok": False, "reason": "出于安全考虑，不读取本机或内网地址"}

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/125.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            content_type = response.headers.get("Content-Type", "")
            charset = response.headers.get_content_charset() or "utf-8"
            body = response.read(MAX_BYTES)
            final_url = response.geturl()
    except urllib.error.HTTPError as exc:
        return {"ok": False, "reason": f"平台返回 HTTP {exc.code}，可能需要登录或限制抓取"}
    except urllib.error.URLError as exc:
        return {"ok": False, "reason": f"无法打开链接：{exc.reason}"}

    text = body.decode(charset, errors="replace")
    if "html" not in content_type.lower():
        return {
            "ok": True,
            "title": "",
            "description": "",
            "text": clean_text(text)[:12000],
            "finalUrl": final_url,
            "contentType": content_type,
        }

    parser = PageTextParser()
    parser.feed(text)
    parsed_page = parser.result()
    parsed_page.update(
        {
            "ok": True,
            "finalUrl": final_url,
            "contentType": content_type,
        }
    )
    return parsed_page


def is_blocked_host(hostname):
    if hostname.lower() in {"localhost", "localhost.localdomain"}:
        return True
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False

    for info in infos:
        address = info[4][0]
        try:
            ip = ipaddress.ip_address(address)
        except ValueError:
            continue
        private_networks = [
            ipaddress.ip_network("10.0.0.0/8"),
            ipaddress.ip_network("172.16.0.0/12"),
            ipaddress.ip_network("192.168.0.0/16"),
            ipaddress.ip_network("fc00::/7"),
        ]
        if ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
            return True
        if any(ip in network for network in private_networks):
            return True
    return False


def clean_text(value):
    return " ".join(unescape(value or "").split())


def dedupe_chunks(chunks):
    seen = set()
    cleaned = []
    for chunk in chunks:
        text = clean_text(chunk)
        if len(text) < 8:
            continue
        key = text[:80]
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(text)
    return clean_text(" ".join(cleaned))[:12000]


if __name__ == "__main__":
    server = ThreadingHTTPServer(("localhost", 8000), Handler)
    print("Saved baggg 运行在 http://localhost:8000/")
    server.serve_forever()
