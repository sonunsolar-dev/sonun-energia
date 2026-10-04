# Skill `campanhas-leads` — especificação

Data: 04/10/2026 · Dono: SONUN (energia solar e baterias) · Status: aprovado em conversa, aguardando revisão deste documento

## 1. Objetivo

Uma skill do Claude Code que transforma anúncios no Instagram (Meta Ads) e no Google Ads em **leads de valor** para negócios com verba pequena, em **ciclos mensais**:

- **Rodada 1 (investigação e plano):** mapa mental de 3 níveis com comparativo dos 5 maiores concorrentes → plano de medição viável → plano de campanha de 30 dias → página de destino → PDF.
- **Rodada 2 em diante (resultados):** lê os resultados reais → novo mapa de 3 níveis sobre fatos → placar → ações para o próximo ciclo → medição de novo.

A skill **prepara e mede**; quem publica e muda campanhas nas contas é o dono (passo a passo fornecido). Integração direta com as APIs de anúncios fica para depois, quando a verba justificar.

## 2. Princípios (valem para tudo o que a skill recomenda)

1. **Desafio em 3 níveis em cada recomendação**, mostrado junto dela:
   - N1: tem mais chance de converter em lead de valor do que as alternativas?
   - N2: cabe na realidade do dono (verba, tempo, quem executa, situação de crédito dos clientes)? Se não cabe, a recomendação é cortada ou adaptada.
   - N3: que evidência sustenta e o que mostraria que está errada?
2. **Evidência, nunca suposição**, e **nunca mascarar resultado** (mesma regra da `seo-mindmap`). Sem dado → "sem dados", com o que falta para verificar.
3. **Amostra pequena é dita como tal**: com poucos contatos por mês, a skill não declara vencedor por acaso; recomenda continuar o teste.
4. **Qualidade antes de volume**: a métrica principal é o **custo por lead qualificado**, não o custo por contato.

## 3. Ficha do negócio (perguntada uma vez, guardada por projeto)

Arquivo `~/.campanhas-leads/<negocio>/ficha.json`:

| Campo | SONUN (valores de 04/10/2026) |
|---|---|
| Lead de valor | conta de luz acima de R$ 700 + interesse em bateria/apagão + capacidade de pagar à vista ou crédito aprovável |
| Verba mensal | R$ 200 (hoje: R$ 100 Google, R$ 100 Instagram) |
| Contrato médio | R$ 30.000 |
| Regra de reinvestimento | 3% de cada contrato fechado vai para campanhas (R$ 900 por contrato médio) |
| Região | Região Metropolitana de Curitiba (prioridade) e Vale do Itajaí |
| Histórico | Google: 0 contatos/mês; Instagram: ~2 contatos/mês, nenhum virou contrato (sem dinheiro ou sem crédito) |
| Quem executa | o próprio dono |
| Onde ficam os contatos | pastas na Área de Trabalho → passa a usar a planilha da skill |
| Site e medição | www.sonun.com.br, GA4 G-7H6CPQ3JL7, formulário Formspree, WhatsApp (47) 98869-2568 |
| Regras fixas | toda menção a financiamento leva "necessário análise de crédito" |

## 4. Rodada 1 — investigação e plano

### 4.1 Mapa de 3 níveis
Raiz: "Qual caminho tem mais chance de trazer leads de valor com a verba atual?". Ramos de nível 1:
1. Quem é o lead de valor e onde ele está (busca no Google, Instagram, indicação)?
2. O que os anúncios atuais atraem e por quê?
3. O que os 5 maiores anunciam e há quanto tempo?
4. Com esta verba, qual canal: Google ou Instagram?
5. Que oferta e mensagem atraem quem tem capacidade de pagar?
6. A página de destino filtra quem não tem perfil?
7. O que dá para medir com o que o dono tem?

Até 3 níveis, mesmos status da `seo-mindmap` (`novo`, `problema`, `ok`, `sem_dados`); aqui "novo" = fato que o dono não sabia.

### 4.2 Comparativo com os 5 maiores
- Seleção comprovada pelo método de `seo-mindmap/references/comparativo.md` (local ou nacional; dois sinais, um verificável por terceiro).
- Fontes gratuitas: **Biblioteca de Anúncios da Meta** (anúncios ativos, data de início, formato, texto, destino) e **Central de Transparência de Anúncios do Google**; páginas de destino dos concorrentes.
- Sinal forte: anúncio ativo há meses tende a estar dando resultado.

### 4.3 Saídas
Mapa interativo (página no claude.ai), plano de medição (seção 5), plano de 30 dias (seção 6) e PDF para imprimir.

## 5. Medição viável

- **Funil:** anúncio → clique → contato → **qualificado** → visita/proposta → **contrato** (ou perdido + motivo).
- **Código de origem por anúncio** (ex.: `IG-BAT1`, `GG-APAG1`): no link (UTM) quando o anúncio leva ao site; na mensagem pronta quando abre o WhatsApp direto. Ajuste em `assets/site.js` do site para levar o código da UTM até a mensagem do WhatsApp e ao formulário.
- **Qualificação no 1º contato:** mensagem pronta com 3 perguntas (conta acima de R$ 700? interesse em bateria/apagão? à vista ou financiado — necessário análise de crédito?).
- **Planilha de contatos** (`Contatos de anúncios - <negocio>.xlsx` na Área de Trabalho), uma linha por contato: data, código, faixa da conta, interesse em bateria, forma de pagamento, situação (lista fechada: contato, qualificado, visita, proposta, contrato, perdido), motivo da perda (lista: sem dinheiro, crédito negado, sem resposta, fora da região, outro), valor do contrato.
- **Google Analytics:** evento de clique no WhatsApp e de envio do formulário com o código; marcados como evento-chave e importados no Google Ads.
- **Indicadores:** custo por contato, **custo por lead qualificado**, taxa de qualificação, custo por contrato, reinvestimento liberado.

## 6. Plano de campanha e página de destino

- **Regra de verba pequena:** abaixo de ~R$ 600/mês, **um canal, uma oferta, uma região**; segundo canal só com o primeiro reinvestimento. O canal sai das evidências do mapa.
- **Filtro no anúncio:** texto que se autoexclui ("para contas acima de R$ 700", "proteção contra apagão"); no Google, palavras de intenção de compra + lista de palavras negativas (barato, grátis, kit, curso, aluguel…).
- **Página de destino por oferta** no site (fora do Google: `noindex`, fora do sitemap), com uma mensagem e 2 perguntas antes do WhatsApp (faixa da conta, forma de pagamento); quem não tem perfil recebe resposta educada e um conteúdo útil.
- **Teste controlado:** 2 a 3 versões, cada uma com seu código, mudando uma variável por vez.
- **Calendário de 30 dias:** semana 1 preparar; semanas 2–4 no ar; 10 min por semana de conferência.
- **Passo a passo de publicação** para o Gerenciador de Anúncios da Meta e para o Google Ads, com as configurações exatas.

## 7. Rodada 2 em diante — resultados

- **Entradas:** planilha de contatos; exportação (ou print) de gasto, cliques e resultados por anúncio das duas contas; Google Analytics (lido pela skill **se** o dono der à conta de leitura `leitor-seo@auditoria-seo-510602.iam.gserviceaccount.com` acesso de Leitor na propriedade GA4 e a "Google Analytics Data API" estiver ativada no projeto; sem isso, print do relatório de eventos); mapa e plano da rodada anterior.
- **Novo mapa de 3 níveis:** raiz "O que a verba comprou e o que fazer com a próxima?"; ramos: qual código trouxe qualificado; por que os contatos se perderam; o filtro funcionou; a mensagem vencedora ganhou de verdade ou a amostra é pequena; os concorrentes mudaram.
- **Placar do mês** (indicadores da seção 5) e **verba do próximo mês** = verba base + reinvestimento liberado.
- **Ações:** manter / ajustar / parar cada anúncio; quando abrir o segundo canal; mudanças na página ou na qualificação — todas com desafio em 3 níveis.
- **Questionar a premissa:** se em 2 ciclos nenhum código trouxer lead qualificado, a skill questiona o canal pago em si (ex.: indicação, parcerias) e não só o anúncio.
- **Histórico:** cada rodada salva em `~/.campanhas-leads/<negocio>/rodadas/` e comparada com a anterior.

## 8. Componentes da skill

```
~/.claude/skills/campanhas-leads/
├── SKILL.md                      fluxo das rodadas, princípios, quando usar
├── references/
│   ├── perguntas-rodada1.md      ramos e como investigar cada um
│   ├── perguntas-rodada2.md      ramos sobre resultados
│   ├── concorrentes-anuncios.md  como ler Biblioteca da Meta e Transparência do Google
│   ├── medicao.md                códigos, UTM, eventos GA4, planilha, indicadores
│   └── publicar.md               passo a passo Meta e Google Ads, verba pequena
└── scripts/
    ├── planilha.py               cria a planilha de contatos (listas fechadas) e lê para o placar
    ├── placar.py                 calcula indicadores e reinvestimento a partir da planilha + gastos
    └── (reuso) seo-mindmap/scripts/gerar_mapa.py e gerar_relatorio.py para mapa e PDF
```

Mudanças no site da SONUN (feitas na rodada 1, com aprovação do dono antes de publicar): código de origem na mensagem do WhatsApp e no formulário (`assets/site.js`); eventos GA4 com o código; página(s) de destino por oferta.

## 9. Fora do escopo (por agora)

- Ligar a skill diretamente às contas (APIs do Google Ads e da Meta).
- CRM ou sistema pago.
- Criação de imagens/vídeos dos anúncios (a skill sugere o conteúdo e o texto; a arte fica com o dono).

## 10. Como saber se deu certo

- Rodada 1 entregue com mapa, comparativo comprovado, plano de medição, plano de 30 dias, página de destino publicada e PDF.
- Após o 1º ciclo: todo contato da planilha tem código de origem; o placar mostra custo por lead qualificado por anúncio.
- Meta do negócio (não da skill): primeiro contrato vindo de anúncio, liberando o primeiro reinvestimento.
