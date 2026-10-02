# Novo site SONUN: estilo C "Foto + Vidro", várias páginas, SEO completo e blog

Data: 2026-10-02 · Aprovado em conversa (mockups A×B×C → A×C com páginas internas → **C**; plano de páginas "aprovado, sim e faça o blog").

## Objetivo

Trocar o site de uma página só (`index.html`, 166 KB, Tailwind por CDN) por um site de várias páginas com:
- o visual **C · Foto + Vidro**: fundo azul-noite, fotos reais grandes, vidro jateado, letras finas;
- uma página própria para cada produto, cada uma otimizada para o Google;
- um blog com 3 artigos iniciais.

Publicar só depois que o usuário navegar pelo site completo em localhost e disser "pode publicar".

## Fora do escopo
- Uma página por cidade (seriam doorway pages). As cidades ficam no rodapé, no contato e no JSON-LD.
- Gerador de site ou etapa de build. O site continua em HTML puro, editável pelo GitHub.
- Mudar o backend dos formulários. Continua Formspree `mwvakapq` + reCAPTCHA `6LewBp4tAAAAANQUFOf2tw92V0TgIVuCQObh6iIX`.

## Páginas e URLs

Cada página é uma pasta com `index.html`, para a URL terminar em `/`.

| URL | Origem no site atual | Prioridade |
|---|---|---|
| `/` | hero, #servicos, números, destaques | — |
| `/energia-solar/` | #diferenciais, #tecnologia (string × micro) | 1 |
| `/energia-solar-com-baterias/` | #hibridos, #tutorial-video, simulador de autonomia | 2 |
| `/bess/` | #bess | 3 |
| `/mercado-livre-de-energia/` | #mercadolivre | 4 |
| `/bess-municipios/` | #municipios, #beneficios (comparativo, gráfico de pico, instalação) | — |
| `/recarga-veicular/` | #carregador | — |
| `/baterias-agro-plano-safra/` | #AGRO | — |
| `/projetos/` | #projetos, #videos | — |
| `/contato/` | #contato (formulário + reCAPTCHA, WhatsApp, 96x / 120 dias) | — |
| `/area-do-cliente/` | #area-cliente (`noindex`) | — |
| `/blog/` + 3 artigos | novo | — |
| `/politica-de-privacidade.html`, `/termos-de-uso.html` | já existem; ganham o visual novo e continuam `noindex` | — |
| `/404.html` | novo, com o mesmo visual | — |

**Links antigos:** um script curto no `/` redireciona as âncoras antigas (`#municipios`, `#AGRO`, `#bess`, `#hibridos`, `#mercadolivre`, `#carregador`, `#contato`, `#projetos`, `#diferenciais`, `#tecnologia`, `#area-cliente`) para as páginas novas.

## Arquivos compartilhados
- `assets/estilo.css`: todo o visual C (tokens, vidro jateado, botões com brilho, cards, formulário, carrossel, FAQ, rodapé, responsivo). Sem Tailwind e sem a biblioteca de ícones Lucide; os ícones viram SVG inline.
- `assets/site.js`: menu mobile, revelação ao rolar, YouTube carregado só ao clicar (facade), envio do formulário com reCAPTCHA (lógica atual), banner do Instagram, redirecionamento das âncoras antigas.
- Imagens em WebP (já existentes). As fotos de topo usam `fetchpriority=high`; as demais, `loading=lazy`.
- Topo e rodapé são repetidos em cada página. O rodapé tem a faixa "Atendemos", links para todas as páginas e para o blog.

## Visual (do protótipo aprovado)
- Fonte **Outfit** 200/300/400/500. Títulos 200 com destaque em 500.
- Fundo `#0b1a2c`. Vidro: `rgba(255,255,255,.10)` + `blur(16px) saturate(140%)`, borda `rgba(255,255,255,.22)`, ruído "jateado" em `::before`. Laranja `#E67E22` e laranja claro `#ffbe8a` para rótulos.
- Efeitos: zoom lento na foto do topo, brilho que atravessa o botão no hover, zoom da foto no hover dos cards, revelação suave ao rolar. Tudo desligado com `prefers-reduced-motion`.
- Cada página interna abre com uma capa de foto (380 px), caminho de navegação e H1.

## SEO por página
- `<title>` único (≤ 65 caracteres) e `meta description` única (≤ 160).
- `canonical`, Open Graph e Twitter Card com a imagem da própria página. `lang="pt-BR"`.
- Um H1 por página e hierarquia H2/H3 correta.
- JSON-LD: `LocalBusiness` em todas as páginas (o mesmo `@id` `#empresa`, cidades em `areaServed`); `Service` + `BreadcrumbList` nas páginas de produto; `FAQPage` onde houver FAQ; `BlogPosting` nos artigos; `WebSite` na home.
- Links internos entre produtos relacionados (solar → híbrido → BESS) e dos artigos para os produtos.
- `sitemap.xml` com todas as páginas indexáveis e `lastmod`. `robots.txt` mantido.
- `noindex` em área do cliente, política, termos e 404.
- Google Analytics `G-7H6CPQ3JL7` em todas as páginas.

## Blog: 3 artigos iniciais (autor "Equipe SONUN")
1. Energia solar ainda vale a pena em 2026? O que muda com a Lei 14.300 (Fio B).
2. Inversor string ou microinversor: qual escolher para o seu telhado?
3. Bateria anti apagão: como funciona o sistema solar híbrido.

Regra: nada de números ou promessas sobre a SONUN que não estejam no site atual. Fatos de regulação apenas quando forem certos e estáveis.

## Conteúdo
Os textos vêm do `index.html` atual, reescritos para leitura e SEO. Dados que podem ser usados: 8 anos, 100% de aprovação Copel/Celesc, 390.000 kWh/mês, até 90% de economia, financiamento em até 96x com até 120 dias de carência, WhatsApp 47 98869-2568, contato@sonun.com.br, Instagram @sonunsolar. O tempo de retorno do investimento ("3 a 5 anos") **não entra** sem confirmação do usuário.

## Publicação
- Trabalho na branch local `novo-site`. O usuário revisa em `http://localhost:8765`.
- Antes de publicar: conferir todos os links internos, validar todo o JSON-LD, tirar screenshots de desktop e mobile, garantir que não há rolagem horizontal.
- Publicar = merge em `main` + push, **somente** após "pode publicar". Depois disso, reenviar o sitemap no Search Console.
- `_config.yml` exclui `docs/` e `.superpowers/` da publicação do GitHub Pages. O `index.html` antigo é substituído; os PNG/JPG originais continuam no repositório.
