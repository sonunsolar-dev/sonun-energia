# Novo site SONUN (estilo C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o site de uma página por um site estático de várias páginas no estilo C "Foto + Vidro", com SEO completo e blog.

**Architecture:** HTML puro, uma pasta por página (`/slug/index.html`). Um CSS (`assets/estilo.css`) e um JS (`assets/site.js`) são compartilhados por todas as páginas. Topo e rodapé são repetidos em cada página. Um validador em Python (`tools/checar_site.py`) funciona como teste: verifica as regras de SEO, os links e as imagens de todas as páginas.

**Tech Stack:** HTML5, CSS (sem Tailwind), JS vanilla, Google Fonts Outfit, Formspree + reCAPTCHA v2, GitHub Pages (Jekyll só para `exclude`), Python 3 + Pillow para checagem e imagens.

**Spec:** `docs/superpowers/specs/2026-10-02-novo-site-estilo-c-seo-design.md`

## Global Constraints
- Domínio canônico: `https://www.sonun.com.br`. Toda página tem `<link rel="canonical">` absoluto terminando em `/` (pastas) ou `.html` (política/termos/404).
- `<title>` ≤ 65 caracteres e `meta description` entre 70 e 160 caracteres, ambos únicos no site.
- Exatamente 1 `<h1>` por página.
- GA4 `G-7H6CPQ3JL7` em todas as páginas.
- Formspree `https://formspree.io/f/mwvakapq`; reCAPTCHA sitekey `6LewBp4tAAAAANQUFOf2tw92V0TgIVuCQObh6iIX`.
- `noindex` em `/area-do-cliente/`, `/politica-de-privacidade.html`, `/termos-de-uso.html`, `/404.html`. Essas páginas ficam fora do sitemap.
- Fonte Outfit 200/300/400/500. Cores: `#0b1a2c` (fundo), `#E67E22` (laranja), `#ffbe8a` (rótulo).
- Dados permitidos: 8 anos; 100% aprovação Copel/Celesc; 390.000 kWh/mês; até 90% de economia; 96x com até 120 dias de carência; WhatsApp 5547988692568; contato@sonun.com.br; @sonunsolar. **Proibido** usar tempo de retorno ("payback") ou qualquer número novo.
- Cidades: Balneário Camboriú, Vale do Itajaí (SC); Curitiba, Pinhais, São José dos Pinhais, Araucária, Fazenda Rio Grande, Campo Largo (PR).
- Arquivos HTML com quebra de linha CRLF (padrão do repositório) e UTF-8.
- Nunca dar commit em `.superpowers/`. Commits com `git -c user.name=rberodrigues -c user.email=rberodrigues@gmail.com`.

## Estrutura de arquivos
```
_config.yml                      exclude: docs, .superpowers, tools, README.md
assets/estilo.css                todo o visual
assets/site.js                   menu, reveal, youtube facade, formulários, âncoras antigas, banner IG
assets/img/                      (não criar — as imagens WebP ficam na raiz, onde já estão)
index.html                       home
energia-solar/index.html
energia-solar-com-baterias/index.html   (inclui simulador de autonomia)
bess/index.html
mercado-livre-de-energia/index.html
bess-municipios/index.html
recarga-veicular/index.html
baterias-agro-plano-safra/index.html
projetos/index.html
contato/index.html
area-do-cliente/index.html
blog/index.html
blog/energia-solar-vale-a-pena-2026-lei-14300/index.html
blog/inversor-string-ou-microinversor/index.html
blog/bateria-anti-apagao-sistema-hibrido/index.html
politica-de-privacidade.html     (refeita no visual novo, conteúdo jurídico mantido)
termos-de-uso.html               (idem)
404.html
sitemap.xml
tools/checar_site.py             validador (teste)
```

### Task 1: Validador de SEO (teste que falha primeiro)

**Files:** Create `tools/checar_site.py`; Modify `_config.yml` (adicionar `tools`).

**Produces:** comando `python tools/checar_site.py` que imprime `OK` e sai com 0, ou lista os erros e sai com 1.

- [ ] Step 1: Escrever o validador com estas checagens para cada página da lista `PAGINAS` (path → indexável?): arquivo existe; `<html lang="pt-BR">`; title com no máximo 65 caracteres e único; description entre 70 e 160 caracteres e única; 1 H1; canonical = URL esperada; `og:title`, `og:description`, `og:image`; GA presente; robots `noindex` se e somente se não indexável; todo bloco JSON-LD faz parse e existe `LocalBusiness` com `@id` `https://www.sonun.com.br/#empresa`; todo `href`/`src` interno (começando com `/` ou relativo) aponta para um arquivo existente; todo `<img>` tem `alt` e `width`/`height`; o sitemap contém exatamente as páginas indexáveis; nenhum `cdn.tailwindcss.com` nem `unpkg.com/lucide`.
- [ ] Step 2: Rodar `python tools/checar_site.py`. Esperado: FALHA (páginas não existem).
- [ ] Step 3: Commit.

### Task 2: Base visual compartilhada + Home
**Files:** Create `assets/estilo.css`, `assets/site.js`; Replace `index.html`.
- CSS: tokens; reset; `.vidro` + `.jateado::before` (ruído SVG); `.btn`, `.btn-sol`, `.btn-vidro` com brilho no hover; topo fixo de vidro com menu "Soluções" e menu mobile; `.capa` (capa com foto, 380px, zoom lento); `.hero` da home (100svh); `.faixa` de produtos; `.cards`; `.passos`; `details` FAQ; `.carrossel`; `.form`; rodapé; `.reveal`; `prefers-reduced-motion`; responsivo em 860px e 520px; sem rolagem horizontal.
- JS: menu mobile (aria-expanded); IntersectionObserver para `.reveal`; YouTube facade (`.yt[data-id]` → iframe ao clicar); envio de formulário com reCAPTCHA (`form[data-formspree]`, mesma lógica do `index.html` antigo); mapa de âncoras antigas → páginas novas; banner do Instagram (`?utm_source=instagram` ou referrer).
- Home: hero C; faixa de 4 produtos (ordem: Solar, Baterias, BESS, Mercado Livre) + linha "outras soluções" (Municípios, Recarga, Agro); números; destaques de projetos (3 fotos → /projetos/); chamada final; JSON-LD `LocalBusiness` + `WebSite`.
- [ ] Rodar o validador: home OK. Screenshot desktop/mobile. Commit.

### Tasks 3–9: Páginas de produto (uma task por página, na ordem de prioridade)
Cada página: capa com foto + migalha + H1; seções com o conteúdo do `index.html` antigo; bloco "Relacionados"; CTA; JSON-LD `LocalBusiness` + `Service` + `BreadcrumbList` (+ `FAQPage` se houver FAQ).
- [ ] 3 `/energia-solar/` (string × micro, passos, FAQ)
- [ ] 4 `/energia-solar-com-baterias/` (híbrido, vídeo tutorial facade, simulador de autonomia migrado com o mesmo cálculo)
- [ ] 5 `/bess/`
- [ ] 6 `/mercado-livre-de-energia/`
- [ ] 7 `/bess-municipios/` (comparativo, gráfico de pico, instalação, investimento)
- [ ] 8 `/recarga-veicular/`
- [ ] 9 `/baterias-agro-plano-safra/`
Depois de cada uma: validador + screenshot + commit.

### Task 10: Projetos, Contato, Área do Cliente
- [ ] `/projetos/` carrossel + vídeos (facade). `/contato/` formulário com reCAPTCHA + cidades + 96x. `/area-do-cliente/` (noindex). Validador + commit.

### Task 11: Blog
- [ ] `/blog/` lista + 3 artigos (`BlogPosting`, autor "Equipe SONUN", `datePublished` 2026-10-02, links para os produtos). Validador + commit.

### Task 12: Política, Termos, 404, sitemap
- [ ] Refazer as páginas legais no visual novo, mantendo o texto jurídico; `404.html`; `sitemap.xml` com todas as páginas indexáveis e lastmod 2026-10-02. Validador 100% OK + commit.

### Task 13: Verificação final (antes de pedir aprovação)
- [ ] Validador OK; screenshots de todas as páginas em 1280 e 390 (viewport real); checar se há rolagem horizontal via `scrollWidth`; testar o simulador; testar o formulário (só a validação do reCAPTCHA, sem enviar); revisar os redirecionamentos das âncoras antigas.
- [ ] Pedir ao usuário para navegar em `http://localhost:8765` → merge em `main` + push **somente** após "pode publicar".
