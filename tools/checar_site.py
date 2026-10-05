"""Validador de SEO do site SONUN.

Uso:  python tools/checar_site.py
Sai com 0 e imprime OK quando todas as páginas passam; senão lista os erros e sai com 1.
"""
import json
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.sonun.com.br"
GA = "G-7H6CPQ3JL7"
EMPRESA_ID = SITE + "/#empresa"

# caminho público -> indexável?
PAGINAS = {
    "/": True,
    "/energia-solar/": True,
    "/energia-solar-curitiba/": True,
    "/energia-solar-com-baterias/": True,
    "/bess/": True,
    "/mercado-livre-de-energia/": True,
    "/bess-municipios/": True,
    "/recarga-veicular/": True,
    "/baterias-agro-plano-safra/": True,
    "/projetos/": True,
    "/quem-somos/": True,
    "/contato/": True,
    "/blog/": True,
    "/blog/energia-solar-vale-a-pena-2026-lei-14300/": True,
    "/blog/inversor-string-ou-microinversor/": True,
    "/blog/bateria-anti-apagao-sistema-hibrido/": True,
    "/area-do-cliente/": False,
    "/politica-de-privacidade.html": False,
    "/termos-de-uso.html": False,
    "/404.html": False,
    "/campanha/bateria-curitiba/": False,
}


def arquivo_de(caminho):
    rel = caminho.lstrip("/")
    if rel == "" or rel.endswith("/"):
        rel += "index.html"
    return os.path.join(RAIZ, *rel.split("/"))


class Coletor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tags = []          # (tag, attrs)
        self.h1 = 0
        self.title = ""
        self._no_title = False
        self._ld = None
        self.ld = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.tags.append((tag, a))
        if tag == "h1":
            self.h1 += 1
        if tag == "title" and not self.title:  # só o <title> do <head>, não o de SVGs
            self._no_title = True
        if tag == "script" and a.get("type") == "application/ld+json":
            self._ld = ""

    def handle_endtag(self, tag):
        if tag == "title":
            self._no_title = False
        if tag == "script" and self._ld is not None:
            self.ld.append(self._ld)
            self._ld = None

    def handle_data(self, data):
        if self._no_title:
            self.title += data
        if self._ld is not None:
            self._ld += data


def tipos_ld(obj):
    out = []
    if isinstance(obj, list):
        for o in obj:
            out += tipos_ld(o)
    elif isinstance(obj, dict):
        t = obj.get("@type")
        out += t if isinstance(t, list) else [t] if t else []
        out.append(("id", obj.get("@id")))
        for v in obj.values():
            if isinstance(v, (dict, list)):
                out += tipos_ld(v)
    return out


def checar():
    erros = []
    titulos, descricoes = {}, {}

    for caminho, indexavel in PAGINAS.items():
        arq = arquivo_de(caminho)
        e = lambda m: erros.append(f"{caminho}: {m}")
        if not os.path.exists(arq):
            e("arquivo não existe")
            continue
        html = open(arq, encoding="utf-8").read()
        c = Coletor()
        c.feed(html)
        metas = {}
        links = {}
        for tag, a in c.tags:
            if tag == "meta":
                k = a.get("name") or a.get("property")
                if k:
                    metas[k] = a.get("content", "")
            if tag == "link" and a.get("rel"):
                links[a["rel"]] = a.get("href", "")
            if tag == "html" and a.get("lang") != "pt-BR":
                e('<html lang="pt-BR"> ausente')

        t = c.title.strip()
        if not t or len(t) > 65:
            e(f"title vazio ou > 65 ({len(t)}): {t!r}")
        titulos.setdefault(t, []).append(caminho)
        d = metas.get("description", "")
        if not 70 <= len(d) <= 160:
            e(f"description fora de 70-160 ({len(d)})")
        descricoes.setdefault(d, []).append(caminho)
        if c.h1 != 1:
            e(f"{c.h1} <h1> (precisa 1)")
        if links.get("canonical") != SITE + caminho:
            e(f"canonical {links.get('canonical')!r} != {SITE + caminho!r}")
        for k in ("og:title", "og:description", "og:image"):
            if not metas.get(k):
                e(f"{k} ausente")
        if GA not in html:
            e("Google Analytics ausente")
        noindex = "noindex" in metas.get("robots", "")
        if indexavel == noindex:
            e("robots noindex errado")
        if "cdn.tailwindcss.com" in html or "unpkg.com/lucide" in html:
            e("Tailwind CDN ou Lucide ainda presente")

        tipos = []
        for bloco in c.ld:
            try:
                tipos += tipos_ld(json.loads(bloco))
            except json.JSONDecodeError as ex:
                e(f"JSON-LD inválido: {ex}")
        if "LocalBusiness" not in tipos or ("id", EMPRESA_ID) not in tipos:
            e("JSON-LD LocalBusiness #empresa ausente")

        base = os.path.dirname(arq)
        for tag, a in c.tags:
            for attr in ("href", "src"):
                v = a.get(attr)
                if not v or tag == "link" and a.get("rel") in ("canonical", "preconnect", "alternate"):
                    continue
                if tag == "meta":
                    continue
                u = urlparse(v)
                if u.scheme in ("http", "https", "mailto", "tel", "data", "javascript") or v.startswith(("#", "//")):
                    continue
                alvo = u.path
                if not alvo:
                    continue
                if alvo.startswith("/"):
                    f = arquivo_de(alvo)
                else:
                    f = os.path.normpath(os.path.join(base, alvo))
                    if alvo.endswith("/"):
                        f = os.path.join(f, "index.html")
                if not os.path.exists(f):
                    e(f"link quebrado {attr}={v}")
            for attr in ("srcset", "imagesrcset"):
                for parte in (a.get(attr) or "").split(","):
                    u = parte.strip().split(" ")[0]
                    if u.startswith("/") and not os.path.exists(arquivo_de(u)):
                        e(f"{attr} quebrado: {u}")
            if tag == "img":
                if a.get("alt") is None:
                    e(f"img sem alt: {a.get('src')}")
                if not a.get("width") or not a.get("height"):
                    e(f"img sem width/height: {a.get('src')}")

    for t, ps in titulos.items():
        if len(ps) > 1:
            erros.append(f"title repetido em {ps}")
    for d, ps in descricoes.items():
        if len(ps) > 1:
            erros.append(f"description repetida em {ps}")

    sm = os.path.join(RAIZ, "sitemap.xml")
    if os.path.exists(sm):
        locs = set(re.findall(r"<loc>([^<]+)</loc>", open(sm, encoding="utf-8").read()))
        esperado = {SITE + p for p, i in PAGINAS.items() if i}
        if locs != esperado:
            erros.append(f"sitemap: faltando {sorted(esperado - locs)} sobrando {sorted(locs - esperado)}")
    else:
        erros.append("sitemap.xml ausente")
    return erros


if __name__ == "__main__":
    so = sys.argv[1:]  # opcional: checar só estes caminhos
    erros = checar()
    if so:
        erros = [x for x in erros if any(x.startswith(p + ":") for p in so)]
    if erros:
        print("\n".join(erros))
        print(f"\n{len(erros)} erro(s)")
        sys.exit(1)
    print("OK")
