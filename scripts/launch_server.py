#!/usr/bin/env python3
"""Local launcher for the contract app.

Starts a lightweight HTTP server from the project root, then optionally opens
Google Chrome to the app URL so the app runs from http://localhost instead of
file://. No extra dependencies are required.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import tempfile
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
MAX_CONVERSION_BYTES = 50 * 1024 * 1024
DEFAULT_PORT = 60691


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def choose_port(host: str, requested_port: int) -> int:
    if requested_port:
        return requested_port
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind((host, DEFAULT_PORT))
        return DEFAULT_PORT
    except OSError:
        fallback = find_free_port()
        print(
            f"Warning: default port {DEFAULT_PORT} is unavailable. Using {fallback}; browser storage is scoped to this temporary port.",
            flush=True,
        )
        return fallback


def open_browser(url: str) -> None:
    if sys.platform == "darwin":
        chrome_app = "/Applications/Google Chrome.app"
        if Path(chrome_app).exists():
            subprocess.Popen(["open", "-a", "Google Chrome", url])
        else:
            subprocess.Popen(["open", url])
        return

    if os.name == "nt":
        subprocess.Popen(["cmd", "/c", "start", "chrome", url], shell=True)
        return

    for candidate in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        if subprocess.call(["bash", "-lc", f"command -v {candidate} >/dev/null 2>&1"]) == 0:
            subprocess.Popen([candidate, url])
            return


def safe_filename(value: str, fallback: str = "Contract.docx") -> str:
    name = Path(value or fallback).name
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', " ", name)
    name = re.sub(r"\s+", " ", name).strip() or fallback
    if not name.lower().endswith(".docx"):
        name = f"{Path(name).stem or 'Contract'}.docx"
    return name


def libreoffice_candidates() -> list[str]:
    runtime_root = Path.home() / ".cache/codex-runtimes"
    candidates = [
        os.environ.get("SOFFICE_PATH", ""),
        shutil.which("soffice") or "",
        shutil.which("libreoffice") or "",
    ]
    if sys.platform == "darwin":
        candidates.extend([
            "/Applications/LibreOffice.app/Contents/MacOS/soffice",
            str(Path.home() / "Applications/LibreOffice.app/Contents/MacOS/soffice"),
        ])
    if os.name == "nt":
        candidates.extend([
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ])
    if runtime_root.exists():
        candidates.extend(str(path) for path in runtime_root.glob("*/dependencies/bin/override/soffice"))
        candidates.extend(str(path) for path in runtime_root.glob("*/dependencies/bin/soffice"))
    return [candidate for candidate in candidates if candidate and Path(candidate).exists()]


def microsoft_word_available() -> bool:
    if sys.platform == "darwin":
        return Path("/Applications/Microsoft Word.app").exists()
    if os.name == "nt":
        return bool(shutil.which("winword"))
    return False


def converter_status() -> dict[str, object]:
    soffice = libreoffice_candidates()
    word = microsoft_word_available()
    return {
        "libreOfficeAvailable": bool(soffice),
        "libreOfficePath": soffice[0] if soffice else "",
        "microsoftWordAvailable": word,
        "preferredEngine": "LibreOffice" if soffice else ("Microsoft Word" if word else ""),
    }


def convert_with_libreoffice(docx_path: Path, temp_dir: Path, soffice_path: str) -> bytes:
    profile_dir = temp_dir / "lo_profile"
    profile_dir.mkdir(exist_ok=True)
    command = [
        str(soffice_path),
        "--headless",
        "--nologo",
        "--nofirststartwizard",
        f"-env:UserInstallation=file://{profile_dir}",
        "--convert-to",
        "pdf",
        "--outdir",
        str(temp_dir),
        str(docx_path),
    ]
    result = subprocess.run(command, cwd=str(temp_dir), stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    pdf_path = docx_path.with_suffix(".pdf")
    if result.returncode != 0 or not pdf_path.exists():
        detail = (result.stderr or result.stdout).decode("utf-8", errors="ignore").strip()
        raise RuntimeError(detail or "LibreOffice PDF conversion failed.")
    return pdf_path.read_bytes()


def convert_with_word_macos(docx_path: Path) -> bytes:
    if sys.platform != "darwin" or not microsoft_word_available():
        raise RuntimeError("Microsoft Word conversion is unavailable on this device.")
    pdf_path = docx_path.with_suffix(".pdf")
    script = f'''
set docxPath to POSIX file "{docx_path}"
set pdfPath to POSIX file "{pdf_path}"
tell application "Microsoft Word"
  activate
  set theDoc to open docxPath
  save as theDoc file name pdfPath file format format PDF
  close theDoc saving no
end tell
'''
    result = subprocess.run(["osascript", "-e", script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    if result.returncode != 0 or not pdf_path.exists():
        detail = (result.stderr or result.stdout).decode("utf-8", errors="ignore").strip()
        raise RuntimeError(detail or "Microsoft Word PDF conversion failed.")
    return pdf_path.read_bytes()


def convert_docx_to_pdf(docx_bytes: bytes, filename: str) -> tuple[bytes, str]:
    safe_name = safe_filename(filename)
    errors: list[str] = []
    with tempfile.TemporaryDirectory(prefix="recm_pdf_") as tmp:
        temp_dir = Path(tmp)
        docx_path = temp_dir / safe_name
        docx_path.write_bytes(docx_bytes)

        for soffice_path in libreoffice_candidates():
            try:
                return convert_with_libreoffice(docx_path, temp_dir, soffice_path), "LibreOffice"
            except Exception as error:
                errors.append(f"LibreOffice: {error}")

        try:
            return convert_with_word_macos(docx_path), "Microsoft Word"
        except Exception as error:
            errors.append(f"Microsoft Word: {error}")

    detail = " ".join(errors).strip()
    raise RuntimeError(detail or "PDF conversion is unavailable on this device.")


class ContractRequestHandler(SimpleHTTPRequestHandler):
    def _json(self, status_code: int, payload: dict[str, object]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/api/converters/status":
            self._json(200, converter_status())
            return
        super().do_GET()

    def do_POST(self) -> None:
        if self.path != "/api/convert-pdf":
            self._json(404, {"error": "Endpoint not found."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_CONVERSION_BYTES:
            self._json(400, {"error": "Invalid DOCX upload size."})
            return

        filename = safe_filename(unquote(self.headers.get("X-Filename", "Contract.docx")))
        try:
            docx_bytes = self.rfile.read(length)
            pdf_bytes, engine = convert_docx_to_pdf(docx_bytes, filename)
        except Exception as error:
            self._json(503, {"error": str(error) or "PDF conversion is unavailable on this device."})
            return

        pdf_filename = f"{Path(filename).stem}.pdf"
        self.send_response(200)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Disposition", f'attachment; filename="{pdf_filename}"')
        self.send_header("X-Conversion-Engine", engine)
        self.send_header("Content-Length", str(len(pdf_bytes)))
        self.end_headers()
        self.wfile.write(pdf_bytes)


def main() -> int:
    parser = argparse.ArgumentParser(description="Launch the contract app on localhost.")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind.")
    parser.add_argument("--port", type=int, default=0, help=f"Port to bind. Default uses stable port {DEFAULT_PORT}; use a custom value only when needed.")
    parser.add_argument("--open", action="store_true", help="Open Google Chrome automatically.")
    parser.add_argument("--no-open", action="store_true", help="Do not open a browser.")
    args = parser.parse_args()

    port = choose_port(args.host, args.port)
    handler = partial(ContractRequestHandler, directory=str(ROOT))
    server = ThreadingHTTPServer((args.host, port), handler)
    url = f"http://localhost:{port}/"

    print(f"Serving {ROOT} at {url}", flush=True)
    print("Press Ctrl+C to stop.", flush=True)

    if args.open and not args.no_open:
        threading.Timer(0.75, open_browser, args=(url,)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
