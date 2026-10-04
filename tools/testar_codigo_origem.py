"""Teste do código de anúncio: abre o site local no Chrome headless com utm_content e confere o DOM.

Uso:  python tools/testar_codigo_origem.py
"""
import functools
import http.server
import os
import shutil
import subprocess
import tempfile
import threading
import urllib.parse

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROMES = [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
           r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"]


def dom(url):
    chrome = next(c for c in CHROMES if os.path.exists(c))
    perfil = tempfile.mkdtemp()
    try:
        r = subprocess.run([chrome, "--headless=new", "--disable-gpu", f"--user-data-dir={perfil}",
                            "--virtual-time-budget=3000", "--dump-dom", url], capture_output=True, text=True,
                           encoding="utf-8", timeout=90)
        return r.stdout
    finally:
        shutil.rmtree(perfil, ignore_errors=True)


def main():
    class Quieto(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    h = functools.partial(Quieto, directory=RAIZ)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}"
    falhas = []
    com = dom(base + "/contato/?utm_source=instagram&utm_content=IG-BAT1")
    if urllib.parse.quote("[IG-BAT1]") not in com:
        falhas.append("WhatsApp sem o código [IG-BAT1]")
    if 'name="codigo_anuncio" value="IG-BAT1"' not in com:
        falhas.append("formulário sem o campo codigo_anuncio")
    invalido = dom(base + "/contato/?utm_content=%3Cscript%3E")
    if "codigo_anuncio" in invalido or urllib.parse.quote("[<script>]") in invalido:
        falhas.append("código inválido não deveria entrar")
    srv.shutdown()
    print("OK" if not falhas else "FALHOU: " + "; ".join(falhas))
    raise SystemExit(1 if falhas else 0)


if __name__ == "__main__":
    main()
