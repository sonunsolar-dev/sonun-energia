# Skill campanhas-leads — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: usar superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar tarefa por tarefa. Os passos usam caixas (`- [ ]`) para acompanhamento.

**Objetivo:** construir a skill `campanhas-leads` (planilha de contatos, placar com reinvestimento, guias das rodadas 1 e 2) e preparar o site da SONUN para medir a origem de cada contato, deixando tudo pronto para a primeira rodada.

**Arquitetura:** a skill fica em `~/.claude/skills/campanhas-leads/`, com o próprio ambiente Python (`.venv`), dois scripts testados (`planilha.py` e `placar.py`) e guias em Markdown. O mapa mental e o PDF reaproveitam `~/.claude/skills/seo-mindmap/scripts/gerar_mapa.py` e `gerar_relatorio.py` (mesmo formato de JSON). No site, uma mudança pequena em `assets/site.js` leva o código do anúncio (UTM `utm_content`) até a mensagem do WhatsApp, o formulário e os eventos do GA4. Uma página de destino `noindex` só entra depois que o dono aprovar o texto.

**Tecnologias:** Python 3.14, openpyxl, pytest; JavaScript ES5 (padrão de `site.js`); Chrome headless para o teste do site; GitHub Pages.

**Especificação:** `docs/superpowers/specs/2026-10-04-campanhas-leads-design.md`

## Restrições globais

- Toda menção a financiamento leva "necessário análise de crédito".
- Lead de valor da SONUN: conta acima de R$ 700, interesse em bateria/apagão, pagamento à vista ou financiado (necessário análise de crédito).
- Reinvestimento: 3% do valor de cada contrato fechado; verba base de R$ 200/mês.
- Nunca mascarar resultado: sem dado vira "sem dados"; amostra pequena é avisada.
- Toda recomendação mostra o desafio em 3 níveis (N1 converte mais? N2 cabe na realidade? N3 evidência / o que a derrubaria?).
- Textos visíveis no site ou nos anúncios só são publicados depois de o dono aprovar.
- Commits no repositório do site: `git -c user.name=rberodrigues -c user.email=rberodrigues@gmail.com commit …` e mensagem terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Arquivos `.html` do site: manter o final de linha que o arquivo já tem (`index.html` usa CRLF; os demais, LF).
- `python tools/checar_site.py` precisa terminar com `OK` antes de qualquer push.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `~/.claude/skills/campanhas-leads/.venv/` | ambiente Python da skill (openpyxl, pytest) |
| `~/.claude/skills/campanhas-leads/scripts/planilha.py` | criar a planilha de contatos (listas fechadas) e ler as linhas |
| `~/.claude/skills/campanhas-leads/scripts/placar.py` | indicadores por código, reinvestimento, verba do próximo mês, aviso de amostra pequena |
| `~/.claude/skills/campanhas-leads/tests/test_planilha.py` | testes da planilha |
| `~/.claude/skills/campanhas-leads/tests/test_placar.py` | testes do placar |
| `~/.claude/skills/campanhas-leads/SKILL.md` | fluxo das rodadas, princípios, ficha, comandos |
| `~/.claude/skills/campanhas-leads/references/perguntas-rodada1.md` | ramos e investigação da rodada 1 |
| `~/.claude/skills/campanhas-leads/references/perguntas-rodada2.md` | ramos sobre resultados |
| `~/.claude/skills/campanhas-leads/references/concorrentes-anuncios.md` | Biblioteca da Meta e Transparência do Google |
| `~/.claude/skills/campanhas-leads/references/medicao.md` | códigos, UTM, eventos, planilha, indicadores |
| `~/.claude/skills/campanhas-leads/references/publicar.md` | passo a passo Meta e Google Ads com verba pequena |
| `~/.campanhas-leads/sonun/ficha.json` | ficha do negócio SONUN |
| `sonun-energia/assets/site.js` | código do anúncio no WhatsApp, no formulário e nos eventos |
| `sonun-energia/tools/testar_codigo_origem.py` | teste do site com Chrome headless |
| `sonun-energia/campanha/bateria-apagao/index.html` | página de destino (Tarefa 6, depois da aprovação) |
| `sonun-energia/tools/checar_site.py` | registrar a página de destino como fora do Google |

---

### Tarefa 1: Planilha de contatos

**Arquivos:**
- Criar: `~/.claude/skills/campanhas-leads/scripts/planilha.py`
- Testar: `~/.claude/skills/campanhas-leads/tests/test_planilha.py`

**Interfaces:**
- Produz:
  - `COLUNAS: list[str]`, `SITUACOES`, `MOTIVOS`, `CONTAS`, `BATERIA`, `PAGAMENTO: list[str]`
  - `criar(caminho: str) -> None` (erro `FileExistsError` se o arquivo já existir)
  - `ler(caminho: str) -> list[dict]` com as chaves `data` (`datetime.date | None`), `codigo`, `nome`, `conta`, `bateria`, `pagamento`, `situacao`, `motivo` (str, minúsculas, sem espaços nas pontas) e `valor` (`float | None`)
  - `eh_qualificado(linha: dict, ficha: dict) -> bool`

- [ ] **Passo 1: Criar o ambiente da skill**

```bash
mkdir -p ~/.claude/skills/campanhas-leads/{scripts,tests,references}
python -m venv ~/.claude/skills/campanhas-leads/.venv
~/.claude/skills/campanhas-leads/.venv/Scripts/python.exe -m pip install --quiet openpyxl pytest
~/.claude/skills/campanhas-leads/.venv/Scripts/python.exe -c "import openpyxl, pytest; print('ok')"
```
Esperado: `ok`

- [ ] **Passo 2: Escrever os testes que devem falhar**

`tests/test_planilha.py`:
```python
import datetime as dt
import os
import sys

import openpyxl
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import planilha  # noqa: E402

FICHA = {"lead_de_valor": {"contas": ["R$ 701 a R$ 1.500", "acima de R$ 1.500"],
                           "bateria": ["sim", "talvez"], "pagamento": ["à vista", "financiado"]}}


def test_criar_tem_cabecalho_e_listas(tmp_path):
    p = tmp_path / "c.xlsx"
    planilha.criar(str(p))
    ws = openpyxl.load_workbook(p).active
    assert [c.value for c in ws[1]] == planilha.COLUNAS
    formulas = " ".join(dv.formula1 for dv in ws.data_validations.dataValidation)
    assert "contrato" in formulas and "sem dinheiro" in formulas


def test_criar_nao_sobrescreve(tmp_path):
    p = tmp_path / "c.xlsx"
    planilha.criar(str(p))
    with pytest.raises(FileExistsError):
        planilha.criar(str(p))


def test_ler_normaliza(tmp_path):
    p = tmp_path / "c.xlsx"
    planilha.criar(str(p))
    wb = openpyxl.load_workbook(p)
    ws = wb.active
    ws.append([dt.datetime(2026, 10, 10), " IG-BAT1 ", "Ana", "acima de R$ 1.500", "Sim", "Financiado",
               "Contrato", None, 31000, ""])
    ws.append([None, None, None, None, None, None, None, None, None, None])  # linha vazia é ignorada
    wb.save(p)
    linhas = planilha.ler(str(p))
    assert len(linhas) == 1
    l = linhas[0]
    assert l["data"] == dt.date(2026, 10, 10) and l["codigo"] == "IG-BAT1"
    assert l["bateria"] == "sim" and l["situacao"] == "contrato" and l["valor"] == 31000.0


def test_eh_qualificado():
    base = {"conta": "acima de R$ 1.500", "bateria": "sim", "pagamento": "financiado"}
    assert planilha.eh_qualificado(base, FICHA)
    assert not planilha.eh_qualificado(dict(base, conta="até R$ 700"), FICHA)
    assert not planilha.eh_qualificado(dict(base, bateria="não"), FICHA)
    assert not planilha.eh_qualificado(dict(base, pagamento="não sabe"), FICHA)
```

- [ ] **Passo 3: Rodar e ver falhar**

Rodar: `cd ~/.claude/skills/campanhas-leads && .venv/Scripts/python.exe -m pytest tests/test_planilha.py -q`
Esperado: FALHA com `ModuleNotFoundError: No module named 'planilha'`

- [ ] **Passo 4: Implementar**

`scripts/planilha.py`:
```python
"""Planilha de contatos dos anúncios: criar (com listas fechadas) e ler.

Uso:  python planilha.py criar "<caminho.xlsx>"
"""
import datetime as dt
import os
import sys

import openpyxl
from openpyxl.styles import Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

COLUNAS = ["Data", "Código do anúncio", "Nome", "Conta de luz", "Interesse em bateria", "Pagamento",
           "Situação", "Motivo da perda", "Valor do contrato (R$)", "Observações"]
SITUACOES = ["contato", "qualificado", "visita", "proposta", "contrato", "perdido"]
MOTIVOS = ["sem dinheiro", "crédito negado", "sem resposta", "fora da região", "outro"]
CONTAS = ["até R$ 700", "R$ 701 a R$ 1.500", "acima de R$ 1.500"]
BATERIA = ["sim", "não", "talvez"]
PAGAMENTO = ["à vista", "financiado", "não sabe"]
CHAVES = ["data", "codigo", "nome", "conta", "bateria", "pagamento", "situacao", "motivo", "valor", "obs"]
LARGURAS = [12, 18, 22, 20, 20, 14, 14, 18, 22, 40]


def _lista(valores, coluna):
    dv = DataValidation(type="list", formula1='"' + ",".join(valores) + '"', allow_blank=True)
    dv.add(f"{coluna}2:{coluna}2000")
    return dv


def criar(caminho):
    if os.path.exists(caminho):
        raise FileExistsError(caminho)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Contatos"
    ws.append(COLUNAS)
    for i, c in enumerate(ws[1]):
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="1F3A5F")
        ws.column_dimensions[c.column_letter].width = LARGURAS[i]
    ws.freeze_panes = "A2"
    for valores, col in ((CONTAS, "D"), (BATERIA, "E"), (PAGAMENTO, "F"), (SITUACOES, "G"), (MOTIVOS, "H")):
        ws.add_data_validation(_lista(valores, col))
    for linha in range(2, 2001):
        ws[f"A{linha}"].number_format = "DD/MM/YYYY"
        ws[f"I{linha}"].number_format = '#,##0.00'
    wb.save(caminho)


def _texto(v):
    return str(v).strip().lower() if v not in (None, "") else ""


def ler(caminho):
    ws = openpyxl.load_workbook(caminho, data_only=True).active
    out = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not any(v not in (None, "") for v in row):
            continue
        r = dict(zip(CHAVES, list(row) + [None] * (len(CHAVES) - len(row))))
        data = r["data"]
        if isinstance(data, dt.datetime):
            data = data.date()
        elif not isinstance(data, dt.date):
            data = None
        try:
            valor = float(r["valor"]) if r["valor"] not in (None, "") else None
        except (TypeError, ValueError):
            valor = None
        out.append({"data": data, "codigo": str(r["codigo"] or "").strip().upper(), "nome": str(r["nome"] or "").strip(),
                    "conta": str(r["conta"] or "").strip(), "bateria": _texto(r["bateria"]),
                    "pagamento": _texto(r["pagamento"]), "situacao": _texto(r["situacao"]),
                    "motivo": _texto(r["motivo"]), "valor": valor})
    return out


def eh_qualificado(linha, ficha):
    lv = ficha["lead_de_valor"]
    return (linha["conta"] in lv["contas"] and linha["bateria"] in lv["bateria"]
            and linha["pagamento"] in lv["pagamento"])


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "criar":
        criar(sys.argv[2])
        print("OK:", sys.argv[2])
    else:
        print(__doc__)
        sys.exit(2)
```

- [ ] **Passo 5: Rodar e ver passar**

Rodar: `.venv/Scripts/python.exe -m pytest tests/test_planilha.py -q`
Esperado: `4 passed`

- [ ] **Passo 6: Registrar** (a pasta da skill não é repositório git; registrar = rodar os testes de novo e anotar no fim do plano que a Tarefa 1 terminou)

---

### Tarefa 2: Placar e reinvestimento

**Arquivos:**
- Criar: `~/.claude/skills/campanhas-leads/scripts/placar.py`
- Testar: `~/.claude/skills/campanhas-leads/tests/test_placar.py`

**Interfaces:**
- Consome: `planilha.ler`, `planilha.eh_qualificado` (Tarefa 1)
- Produz: `calcular(contatos: list[dict], gastos: dict[str, float], ficha: dict) -> dict` com as chaves:
  - `por_codigo`: `{codigo: {"gasto", "contatos", "qualificados", "contratos", "valor_contratos", "custo_contato", "custo_qualificado", "custo_contrato", "taxa_qualificacao"}}` (custos `None` quando o divisor é 0)
  - `total`: os mesmos campos somados
  - `motivos_perda`: `{motivo: n}`
  - `reinvestimento: float`, `verba_proximo_mes: float`, `amostra_pequena: bool`, `sem_codigo: int`

- [ ] **Passo 1: Escrever os testes que devem falhar**

`tests/test_placar.py`:
```python
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import placar  # noqa: E402

FICHA = {"verba_mensal": 200.0, "reinvestimento": 0.03,
         "lead_de_valor": {"contas": ["R$ 701 a R$ 1.500", "acima de R$ 1.500"],
                           "bateria": ["sim", "talvez"], "pagamento": ["à vista", "financiado"]}}


def c(codigo, conta="acima de R$ 1.500", bateria="sim", pagamento="financiado", situacao="contato", motivo="", valor=None):
    return {"data": None, "codigo": codigo, "nome": "", "conta": conta, "bateria": bateria, "pagamento": pagamento,
            "situacao": situacao, "motivo": motivo, "valor": valor}


def test_custos_por_codigo():
    contatos = [c("IG-BAT1"), c("IG-BAT1", conta="até R$ 700", situacao="perdido", motivo="sem dinheiro"),
                c("IG-BAT1", situacao="contrato", valor=30000.0)]
    r = placar.calcular(contatos, {"IG-BAT1": 100.0, "GG-APAG1": 100.0}, FICHA)
    ig = r["por_codigo"]["IG-BAT1"]
    assert ig["contatos"] == 3 and ig["qualificados"] == 2 and ig["contratos"] == 1
    assert ig["custo_contato"] == 100 / 3 and ig["custo_qualificado"] == 50.0 and ig["custo_contrato"] == 100.0
    gg = r["por_codigo"]["GG-APAG1"]
    assert gg["contatos"] == 0 and gg["custo_contato"] is None
    assert r["motivos_perda"] == {"sem dinheiro": 1}


def test_reinvestimento_e_verba():
    r = placar.calcular([c("IG-BAT1", situacao="contrato", valor=30000.0)], {"IG-BAT1": 100.0}, FICHA)
    assert r["reinvestimento"] == 900.0 and r["verba_proximo_mes"] == 1100.0


def test_amostra_pequena_e_sem_codigo():
    r = placar.calcular([c(""), c("IG-BAT1")], {"IG-BAT1": 100.0}, FICHA)
    assert r["amostra_pequena"] is True and r["sem_codigo"] == 1
    assert "SEM CÓDIGO" in r["por_codigo"]
```

- [ ] **Passo 2: Rodar e ver falhar**

Rodar: `.venv/Scripts/python.exe -m pytest tests/test_placar.py -q`
Esperado: FALHA com `ModuleNotFoundError: No module named 'placar'`

- [ ] **Passo 3: Implementar**

`scripts/placar.py`:
```python
"""Placar do mês: custo por contato, por lead qualificado e por contrato, por código de anúncio.

Uso:  python placar.py "<planilha.xlsx>" "<gastos.json>" "<ficha.json>"
gastos.json = {"IG-BAT1": 100.0, "GG-APAG1": 100.0}  (gasto do período por código, das contas de anúncio)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import planilha  # noqa: E402

AMOSTRA_MINIMA = 5  # menos que 5 leads qualificados no período: não declarar vencedor


def _div(a, b):
    return a / b if b else None


def _linha(gasto, cs, ficha):
    q = sum(1 for x in cs if planilha.eh_qualificado(x, ficha))
    k = [x for x in cs if x["situacao"] == "contrato"]
    valor = sum(x["valor"] or 0 for x in k)
    return {"gasto": gasto, "contatos": len(cs), "qualificados": q, "contratos": len(k), "valor_contratos": valor,
            "custo_contato": _div(gasto, len(cs)), "custo_qualificado": _div(gasto, q),
            "custo_contrato": _div(gasto, len(k)), "taxa_qualificacao": _div(q, len(cs))}


def calcular(contatos, gastos, ficha):
    grupos = {}
    for x in contatos:
        grupos.setdefault(x["codigo"] or "SEM CÓDIGO", []).append(x)
    codigos = list(dict.fromkeys(list(gastos) + list(grupos)))
    por = {cod: _linha(float(gastos.get(cod, 0.0)), grupos.get(cod, []), ficha) for cod in codigos}
    total = _linha(float(sum(gastos.values())), contatos, ficha)
    motivos = {}
    for x in contatos:
        if x["situacao"] == "perdido" and x["motivo"]:
            motivos[x["motivo"]] = motivos.get(x["motivo"], 0) + 1
    reinv = round(total["valor_contratos"] * ficha["reinvestimento"], 2)
    return {"por_codigo": por, "total": total, "motivos_perda": motivos, "reinvestimento": reinv,
            "verba_proximo_mes": round(ficha["verba_mensal"] + reinv, 2),
            "amostra_pequena": total["qualificados"] < AMOSTRA_MINIMA,
            "sem_codigo": len(grupos.get("SEM CÓDIGO", []))}


def _r(v):
    return "—" if v is None else f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def tabela(res):
    L = ["| Código | Gasto | Contatos | Qualificados | Contratos | Custo/contato | Custo/qualificado | Custo/contrato |",
         "|---|---|---|---|---|---|---|---|"]
    for cod, v in list(res["por_codigo"].items()) + [("TOTAL", res["total"])]:
        L.append(f"| {cod} | {_r(v['gasto'])} | {v['contatos']} | {v['qualificados']} | {v['contratos']} | "
                 f"{_r(v['custo_contato'])} | {_r(v['custo_qualificado'])} | {_r(v['custo_contrato'])} |")
    L.append(f"\nReinvestimento liberado: {_r(res['reinvestimento'])} · verba do próximo mês: {_r(res['verba_proximo_mes'])}")
    if res["amostra_pequena"]:
        L.append(f"Amostra pequena: menos de {AMOSTRA_MINIMA} leads qualificados — não dá para declarar vencedor.")
    if res["sem_codigo"]:
        L.append(f"{res['sem_codigo']} contato(s) sem código de anúncio na planilha.")
    return "\n".join(L)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(2)
    with open(sys.argv[2], encoding="utf-8") as f:
        gastos = json.load(f)
    with open(sys.argv[3], encoding="utf-8") as f:
        ficha = json.load(f)
    res = calcular(planilha.ler(sys.argv[1]), gastos, ficha)
    print(tabela(res))
    print(json.dumps(res, ensure_ascii=False, indent=2))
```

- [ ] **Passo 4: Rodar e ver passar**

Rodar: `.venv/Scripts/python.exe -m pytest tests -q`
Esperado: `7 passed`

---

### Tarefa 3: Ficha da SONUN e guias da skill

**Arquivos:**
- Criar: `~/.campanhas-leads/sonun/ficha.json`
- Criar: `~/.claude/skills/campanhas-leads/SKILL.md` e os 5 arquivos de `references/`

**Interfaces:**
- Consome: `planilha.py criar`, `placar.py` (Tarefas 1–2); `seo-mindmap/scripts/gerar_mapa.py`, `gerar_relatorio.py`, `references/comparativo.md`, `scripts/pagespeed.py`
- Produz: o formato da ficha usado pelas Tarefas 1–2 (`verba_mensal`, `reinvestimento`, `lead_de_valor.contas|bateria|pagamento`)

- [ ] **Passo 1: Criar a ficha da SONUN**

`~/.campanhas-leads/sonun/ficha.json`:
```json
{
  "negocio": "SONUN Energia Solar e Baterias",
  "site": "https://www.sonun.com.br",
  "verba_mensal": 200.0,
  "reinvestimento": 0.03,
  "contrato_medio": 30000.0,
  "lead_de_valor": {
    "descricao": "conta de luz acima de R$ 700 + interesse em bateria/apagão + paga à vista ou financiado (necessário análise de crédito)",
    "contas": ["R$ 701 a R$ 1.500", "acima de R$ 1.500"],
    "bateria": ["sim", "talvez"],
    "pagamento": ["à vista", "financiado"]
  },
  "regiao": "Região Metropolitana de Curitiba (prioridade) e Vale do Itajaí",
  "historico": "Google R$ 100/mês: 0 contatos. Instagram R$ 100/mês: ~2 contatos/mês, nenhum contrato (sem dinheiro ou sem crédito).",
  "quem_executa": "o próprio dono",
  "planilha": "Área de Trabalho/Contatos de anúncios - SONUN.xlsx",
  "ga4": "G-7H6CPQ3JL7",
  "whatsapp": "5547988692568",
  "regras_fixas": ["Toda menção a financiamento leva 'necessário análise de crédito'."]
}
```

- [ ] **Passo 2: Escrever o `SKILL.md`**

Conteúdo (frontmatter + corpo):
```markdown
---
name: campanhas-leads
description: Campanhas no Instagram (Meta Ads) e no Google Ads para trazer LEADS DE VALOR com verba pequena, em ciclos mensais. Rodada 1: mapa mental de 3 níveis comparando com os 5 maiores concorrentes (Biblioteca de Anúncios da Meta, Transparência de Anúncios do Google), plano de medição viável (código por anúncio, planilha de contatos, eventos), plano de 30 dias e página de destino. Rodada 2+: lê os resultados, faz novas perguntas, calcula custo por lead qualificado e reinvestimento, sugere ações. Use sempre que o usuário falar de anúncios, impulsionar post, tráfego pago, Google Ads, Meta Ads, leads, "campanha não traz cliente", verba de marketing ou reinvestimento — mesmo sem dizer "skill".
---

# Campanhas que trazem leads de valor

A skill prepara e mede; quem publica nas contas de anúncio é o dono, com o passo a passo de `references/publicar.md`.

## Princípios
1. Desafio em 3 níveis em toda recomendação, mostrado junto dela: N1 tem mais chance de converter em lead de valor que as alternativas? N2 cabe na realidade do dono (verba, tempo, quem executa, crédito dos clientes)? Se não cabe, corte ou adapte. N3 que evidência sustenta e o que a derrubaria?
2. Evidência, nunca suposição. Sem dado → `sem_dados`. Nunca suavizar resultado.
3. Amostra pequena é dita como tal (o placar avisa abaixo de 5 qualificados).
4. Qualidade antes de volume: a métrica principal é o custo por lead qualificado.
5. A pesquisa na web do Claude não é o Google: serve para descobrir quem existe e abrir páginas; posição no Google só com o dono ou com o Search Console.

## Ficha do negócio
Leia `~/.campanhas-leads/<negocio>/ficha.json`. Se não existir, pergunte (uma pergunta por vez): o que é lead de valor, verba mensal, contrato médio, regra de reinvestimento, região, o que já tentou e com que resultado, quem executa, onde ficam os contatos. Grave a ficha.

## Rodada 1 — investigação e plano
1. Leia `references/perguntas-rodada1.md` e `~/.claude/skills/seo-mindmap/references/comparativo.md`.
2. Investigue os 5 maiores concorrentes comprovados e os anúncios deles (`references/concorrentes-anuncios.md`).
3. Monte o mapa de 3 níveis no formato JSON da `seo-mindmap` (com `comparativo`) e gere a página e o PDF:
   `python ~/.claude/skills/seo-mindmap/scripts/gerar_mapa.py mapa.json mapa.html` (publique como página no claude.ai)
   `python ~/.claude/skills/seo-mindmap/scripts/gerar_relatorio.py mapa.json` (PDF na Área de Trabalho)
4. Plano de medição (`references/medicao.md`): códigos de anúncio, mensagem de qualificação, planilha:
   `~/.claude/skills/campanhas-leads/.venv/Scripts/python.exe ~/.claude/skills/campanhas-leads/scripts/planilha.py criar "<Área de Trabalho>/Contatos de anúncios - <negocio>.xlsx"`
5. Plano de 30 dias (`references/publicar.md`): um canal, uma oferta, uma região abaixo de ~R$ 600/mês; filtro no texto do anúncio; 2–3 versões com códigos; página de destino.
6. Mudanças no site e textos de anúncio: mostrar ao dono e só publicar com aprovação.

## Rodada 2 em diante — resultados
1. Peça: a planilha atualizada e o gasto por anúncio do período (exportação ou print das contas). Monte `gastos.json` = `{"CÓDIGO": valor}`.
2. Placar: `~/.claude/skills/campanhas-leads/.venv/Scripts/python.exe ~/.claude/skills/campanhas-leads/scripts/placar.py "<planilha>" gastos.json ~/.campanhas-leads/<negocio>/ficha.json`
3. Leia `references/perguntas-rodada2.md`, monte o novo mapa (raiz: "O que a verba comprou e o que fazer com a próxima?") e gere página e PDF.
4. Ações (manter/ajustar/parar cada código; abrir segundo canal só com reinvestimento), cada uma com o desafio em 3 níveis. Se em 2 ciclos nenhum código trouxe lead qualificado, questione o canal pago em si.
5. Salve a rodada em `~/.campanhas-leads/<negocio>/rodadas/AAAA-MM-DD/` (mapa.json, gastos.json, placar.md) e compare com a anterior.
```

- [ ] **Passo 3: Escrever `references/perguntas-rodada1.md`**

Conteúdo: os 7 ramos da especificação §4.1, cada um com 2–3 perguntas de nível 2/3 e a fonte de evidência:
```markdown
# Rodada 1 — ramos e como investigar

1. **Quem é o lead de valor e onde ele está?** — Ele busca no Google (intenção: "bateria para apagão + cidade") ou é alcançado no Instagram (interesse)? Evidência: Search Console (consultas), comentários/mensagens recebidas, perguntas do público (pesquisa na web).
2. **O que os anúncios atuais atraem e por quê?** — Texto, imagem, público e destino de cada anúncio atual; perfil dos contatos que chegaram (motivo de perda). Evidência: prints dos anúncios e do público, conversa com o dono.
3. **O que os 5 maiores anunciam?** — Quantos anúncios ativos, há quanto tempo, oferta, chamada, destino. Evidência: `concorrentes-anuncios.md`.
4. **Com esta verba, qual canal?** — Custo por clique estimado das palavras de intenção (Planejador de Palavras-chave do Google Ads, pelo dono) × custo por contato atual do Instagram. Evidência: números das contas.
5. **Que oferta e mensagem atraem quem pode pagar?** — Filtro no texto ("para contas acima de R$ 700"), tema (apagão/segurança × economia). Evidência: anúncios dos concorrentes que rodam há meses; perfil dos contatos perdidos.
6. **A página de destino filtra quem não tem perfil?** — Para onde o anúncio leva hoje; quantas perguntas antes do contato. Evidência: a página.
7. **O que dá para medir com o que o dono tem?** — Código no link/mensagem, planilha, eventos GA4. Evidência: `medicao.md`, teste do site.
```

- [ ] **Passo 4: Escrever `references/perguntas-rodada2.md`**

```markdown
# Rodada 2+ — ramos sobre resultados

1. **Qual código trouxe lead qualificado e qual só gastou?** — Placar por código; contatos sem código.
2. **Por que os contatos se perderam?** — `motivos_perda` do placar; padrão por código (ex.: um anúncio só traz "sem dinheiro").
3. **O filtro funcionou?** — Taxa de qualificação antes × depois; menos contatos e mais qualificados é sucesso.
4. **A mensagem vencedora ganhou de verdade?** — Se `amostra_pequena`, dizer que não dá para concluir e manter o teste.
5. **Os concorrentes mudaram?** — Repetir a consulta da Biblioteca da Meta e da Transparência do Google; anúncios novos ou parados.
6. **A premissa ainda vale?** — Se 2 ciclos sem lead qualificado: canal pago com esta verba é o caminho? Alternativas (indicação, parcerias) com desafio em 3 níveis.
```

- [ ] **Passo 5: Escrever `references/concorrentes-anuncios.md`**

```markdown
# Anúncios dos concorrentes (fontes gratuitas)

- **Biblioteca de Anúncios da Meta:** facebook.com/ads/library → país Brasil → categoria "Todos os anúncios" → buscar o nome da empresa ou a página. Anote: nº de anúncios ativos, "Veiculação iniciada em" (há quanto tempo), formato (imagem, vídeo, carrossel), texto principal, chamada (botão) e destino (site, WhatsApp, formulário). Anúncio ativo há mais de 60 dias é sinal de que dá resultado.
- **Central de Transparência de Anúncios do Google:** adstransparency.google.com → buscar o anunciante ou o domínio → região Brasil. Anote: formatos (texto/pesquisa, imagem, vídeo), últimas datas exibidas, textos.
- Se a página não abrir pela ferramenta do Claude (as duas exigem navegador), peça ao dono prints da busca de cada concorrente; registre a data.
- Use os 5 concorrentes comprovados de `seo-mindmap/references/comparativo.md`; acrescente quem aparece anunciando para as palavras principais, com prova.
- Critérios do comparativo de anúncios: anuncia na Meta? quantos ativos e há quanto tempo; anuncia no Google? tema principal (economia × apagão/segurança); filtro de público no texto; destino; oferta (simulação, preço, financiamento).
```

- [ ] **Passo 6: Escrever `references/medicao.md`**

```markdown
# Medição viável

- **Código do anúncio:** 2–3 letras do canal + tema + nº (ex.: IG-BAT1, GG-APAG1). Formato aceito pelo site: `^[A-Z]{2,3}-[A-Z0-9]{2,12}$`.
- **Anúncio que leva ao site:** link com `?utm_source=instagram|google&utm_medium=cpc&utm_campaign=<oferta>&utm_content=<CÓDIGO>`. O site (assets/site.js) coloca o código no fim da mensagem do WhatsApp entre colchetes, num campo oculto `codigo_anuncio` do formulário e nos eventos `whatsapp_click` e `generate_lead` do GA4.
- **Anúncio que abre o WhatsApp direto:** colocar o código na mensagem pronta do anúncio, entre colchetes.
- **Mensagem de qualificação** (o dono cola na 1ª resposta): "Olá! Para eu preparar sua simulação, me conta rapidinho: 1) sua conta de luz fica até R$ 700, de R$ 701 a R$ 1.500 ou acima de R$ 1.500? 2) você quer bateria para não ficar sem luz no apagão? 3) pensa em pagar à vista ou financiado (necessário análise de crédito)?"
- **Planilha:** `planilha.py criar` na Área de Trabalho; uma linha por contato; o código vem dos colchetes da mensagem.
- **GA4:** marcar `whatsapp_click` e `generate_lead` como eventos-chave (Administrador → Eventos → marcar) e importar no Google Ads (Metas → Conversões → Importar → Google Analytics 4).
- **Indicadores:** custo por contato, custo por lead qualificado (principal), taxa de qualificação, custo por contrato, reinvestimento = 3% × valor dos contratos.
```

- [ ] **Passo 7: Escrever `references/publicar.md`**

```markdown
# Publicar com verba pequena

- **Regra:** abaixo de ~R$ 600/mês → 1 canal, 1 oferta, 1 região. Segundo canal só com o primeiro reinvestimento.
- **Meta (Gerenciador de Anúncios):** Criar → objetivo "Leads" ou "Engajamento → mensagens" (WhatsApp) → orçamento diário (verba ÷ 30) → localização: cidades da região (raio) → idade 30+ → posicionamentos automáticos → anúncio com o texto aprovado (filtro no texto) → destino: página de destino com UTM ou WhatsApp com mensagem pronta com o código. Uma versão por conjunto de anúncios, cada uma com seu código.
- **Google Ads:** campanha de Pesquisa (não Performance Max com esta verba) → orçamento diário → local: região, "presença" (pessoas na região) → palavras de intenção em correspondência de frase/exata (ex.: "bateria para apagão", "sistema híbrido com bateria", "energia solar com bateria + cidade") → palavras negativas: barato, grátis, kit, curso, aluguel, emprego, vaga, como fazer, diy → anúncio com o filtro no título/descrição → link com UTM e código.
- **Conferência semanal (10 min):** gasto, cliques, contatos por código; nada de mexer antes de 7 dias, salvo erro.
- Todo texto de anúncio e de página: mostrar ao dono antes de publicar; financiamento sempre com "necessário análise de crédito".
```

- [ ] **Passo 8: Conferir que a skill aparece e os testes continuam passando**

Rodar: `cd ~/.claude/skills/campanhas-leads && .venv/Scripts/python.exe -m pytest tests -q`
Esperado: `7 passed`. Na próxima mensagem do sistema, `campanhas-leads` deve aparecer na lista de skills.

---

### Tarefa 4: Código do anúncio no site (WhatsApp, formulário, eventos)

**Arquivos:**
- Modificar: `sonun-energia/assets/site.js` (bloco "origem do visitante", linhas ~77–119)
- Criar: `sonun-energia/tools/testar_codigo_origem.py`

**Interfaces:**
- Produz: na página, links `[data-whats]` com `?text=` terminando em ` [CÓDIGO]` quando a URL tem `utm_content=CÓDIGO` válido; campo oculto `codigo_anuncio` em todo `<form>`; parâmetro `codigo_anuncio` nos eventos `whatsapp_click` e `generate_lead`.

- [ ] **Passo 1: Escrever o teste que deve falhar**

`tools/testar_codigo_origem.py`:
```python
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
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=RAIZ)
    h.log_message = lambda *a: None
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
```

- [ ] **Passo 2: Rodar e ver falhar**

Rodar: `cd /c/Users/sonun/sonun-energia && python tools/testar_codigo_origem.py`
Esperado: `FALHOU: WhatsApp sem o código [IG-BAT1]; formulário sem o campo codigo_anuncio`

- [ ] **Passo 3: Implementar em `assets/site.js`**

Logo depois da linha `var rotuloOrigem = doInstagram ? 'Instagram' : (origem.utm_source || 'Direto/Outro');` acrescentar:
```javascript
  // código do anúncio (utm_content), ex.: IG-BAT1 — só no formato combinado, para não injetar texto qualquer
  var codigo = /^[A-Z]{2,3}-[A-Z0-9]{2,12}$/.test(origem.utm_content || '') ? origem.utm_content : '';
```
Dentro do `document.querySelectorAll('form').forEach(function (form) {`, depois da linha que cria o campo `pagina`, acrescentar:
```javascript
    if (codigo) { var k = document.createElement('input'); k.type = 'hidden'; k.name = 'codigo_anuncio'; k.value = codigo; form.appendChild(k); }
```
Trocar a linha `var link = 'https://wa.me/5547988692568?text=' + encodeURIComponent(msg);` por:
```javascript
  var link = 'https://wa.me/5547988692568?text=' + encodeURIComponent(msg + (codigo ? ' [' + codigo + ']' : ''));
```
Trocar a função `evento` por:
```javascript
  var evento = function (nome) { if (typeof gtag === 'function') gtag('event', nome, { origem_lead: rotuloOrigem, pagina: location.pathname, codigo_anuncio: codigo || '(sem código)' }); };
```

- [ ] **Passo 4: Rodar e ver passar**

Rodar: `python tools/testar_codigo_origem.py && python tools/checar_site.py`
Esperado: `OK` e `OK`

- [ ] **Passo 5: Mostrar ao dono e publicar com aprovação**

Explicar ao dono (o visitante comum não vê diferença; só quem chega por anúncio com código tem `[CÓDIGO]` no fim da mensagem do WhatsApp). Com aprovação:
```bash
git add assets/site.js tools/testar_codigo_origem.py
git -c user.name=rberodrigues -c user.email=rberodrigues@gmail.com commit -m "medição: código do anúncio (utm_content) no WhatsApp, no formulário e nos eventos do GA4

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```
Depois do deploy (~1 min), conferir no site publicado: `curl -s https://www.sonun.com.br/assets/site.js | grep -c codigo_anuncio` → `3`. Se o navegador dos visitantes guardar o `site.js` antigo (cache de 10 min do GitHub Pages), não há ação: some sozinho.

---

### Tarefa 5: Rodada 1 na SONUN (investigação, mapa, comparativo, PDF, planilha)

**Arquivos:**
- Criar: `~/.campanhas-leads/sonun/rodadas/2026-10-XX/mapa.json` (data do dia)
- Criar: página do mapa (claude.ai) e PDF na Área de Trabalho
- Criar: `Área de Trabalho/Contatos de anúncios - SONUN.xlsx`

**Interfaces:**
- Consome: Tarefas 1–4; `gerar_mapa.py`, `gerar_relatorio.py`, `pagespeed.py`

- [ ] **Passo 1:** Pedir ao dono: (a) os 5 primeiros do Google para "energia solar Curitiba" e "bateria para apagão Curitiba"; (b) prints dos 2 anúncios atuais (texto, imagem, público, destino) e do resultado de cada um; (c) se quiser velocidade dos concorrentes, ativar a PageSpeed Insights API.
- [ ] **Passo 2:** Consultar Biblioteca da Meta e Transparência do Google para os 5 concorrentes (`concorrentes-anuncios.md`); se as páginas não abrirem pela ferramenta, pedir prints ao dono.
- [ ] **Passo 3:** Montar `mapa.json` (7 ramos, até 3 níveis, `comparativo` com prova) e rodar `gerar_mapa.py` → corrigir avisos → publicar a página.
- [ ] **Passo 4:** Rodar `gerar_relatorio.py mapa.json` → PDF na Área de Trabalho.
- [ ] **Passo 5:** Criar a planilha: `~/.claude/skills/campanhas-leads/.venv/Scripts/python.exe ~/.claude/skills/campanhas-leads/scripts/planilha.py criar "<Área de Trabalho>/Contatos de anúncios - SONUN.xlsx"` → abrir e conferir as listas.
- [ ] **Passo 6:** Apresentar ao dono: fatos novos, comparativo, plano de 30 dias com desafio em 3 níveis, textos de 2–3 anúncios com códigos e a proposta de página de destino. Esperar aprovação.

---

### Tarefa 6: Página de destino (só depois da aprovação do texto na Tarefa 5)

**Arquivos:**
- Criar: `sonun-energia/campanha/bateria-apagao/index.html` (nome final conforme a oferta aprovada)
- Modificar: `sonun-energia/tools/checar_site.py` (dicionário `PAGINAS`)

**Interfaces:**
- Consome: `assets/site.js` com código do anúncio (Tarefa 4); texto aprovado (Tarefa 5)

- [ ] **Passo 1: Registrar a página como fora do Google no verificador (teste que falha)**

Em `tools/checar_site.py`, no dicionário `PAGINAS`, acrescentar:
```python
    "/campanha/bateria-apagao/": False,
```
Rodar: `python tools/checar_site.py` → esperado: erro apontando que a página não existe.

- [ ] **Passo 2: Criar a página**

Copiar o cabeçalho/rodapé de `energia-solar-com-baterias/index.html`, com:
- `<meta name="robots" content="noindex, follow">` e sem `<link rel="canonical">` para outra página;
- fora do `sitemap.xml` e sem link no menu/rodapé (só chega quem vem do anúncio);
- texto aprovado pelo dono (uma mensagem, uma chamada);
- bloco de qualificação:
```html
<form class="form vidro" id="qualifica" novalidate>
  <fieldset><legend>Sua conta de luz por mês</legend>
    <label><input type="radio" name="conta" value="ate700" required> até R$ 700</label>
    <label><input type="radio" name="conta" value="701a1500"> R$ 701 a R$ 1.500</label>
    <label><input type="radio" name="conta" value="acima1500"> acima de R$ 1.500</label></fieldset>
  <fieldset><legend>Como pensa em investir?</legend>
    <label><input type="radio" name="pag" value="vista" required> à vista</label>
    <label><input type="radio" name="pag" value="financiado"> financiado (necessário análise de crédito)</label>
    <label><input type="radio" name="pag" value="naosei"> ainda não sei</label></fieldset>
  <button class="btn btn-sol" type="submit">Ver se o sistema é para mim</button>
  <p class="status" id="q-status" aria-live="polite"></p>
</form>
<script>
(function () {
  var f = document.getElementById('qualifica');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    var conta = f.conta.value, pag = f.pag.value;
    var st = document.getElementById('q-status');
    if (conta === 'ate700') {
      st.innerHTML = 'Com conta até R$ 700, a bateria costuma não se pagar. Veja como funciona e quando vale a pena: <a href="/blog/bateria-anti-apagao-sistema-hibrido/">bateria anti apagão</a>.';
      if (typeof gtag === 'function') gtag('event', 'lead_fora_do_perfil', { motivo: 'conta_ate_700' });
      return;
    }
    var w = document.querySelector('a[data-whats]');
    var rot = { '701a1500': 'R$ 701 a R$ 1.500', 'acima1500': 'acima de R$ 1.500', vista: 'à vista', financiado: 'financiado', naosei: 'ainda não sei' };
    var extra = ' Conta: ' + rot[conta] + '. Pagamento: ' + rot[pag] + '.';
    var href = w ? w.href.replace(/(text=)([^&]*)/, function (m, a, t) { var d = decodeURIComponent(t); var i = d.lastIndexOf(' ['); return a + encodeURIComponent(i > -1 ? d.slice(0, i) + extra + d.slice(i) : d + extra); }) : 'https://wa.me/5547988692568';
    if (typeof gtag === 'function') gtag('event', 'lead_qualificado_pagina', { conta: conta, pagamento: pag });
    location.href = href;
  });
})();
</script>
```

- [ ] **Passo 3: Verificar**

Rodar: `python tools/checar_site.py` → `OK`. Abrir localmente `http://localhost:8765/campanha/bateria-apagao/?utm_source=instagram&utm_content=IG-BAT1` (servidor `python -m http.server 8765`), escolher "acima de R$ 1.500" + "financiado" → o WhatsApp abre com "… Conta: acima de R$ 1.500. Pagamento: financiado. [IG-BAT1]"; escolher "até R$ 700" → aparece a mensagem educada, sem WhatsApp.

- [ ] **Passo 4: Mostrar ao dono e publicar com aprovação**

```bash
git add campanha/bateria-apagao/index.html tools/checar_site.py
git -c user.name=rberodrigues -c user.email=rberodrigues@gmail.com commit -m "campanha: página de destino bateria anti apagão (noindex, qualificação antes do WhatsApp)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```
Conferir no ar: `curl -s https://www.sonun.com.br/campanha/bateria-apagao/ | grep -c noindex` → `1`; a URL não está no `sitemap.xml`.

---

## Depois do plano

- O dono publica os anúncios (passo a passo de `publicar.md`) e preenche a planilha por 30 dias.
- Rodada 2 (~30 dias depois): `SKILL.md` → "Rodada 2 em diante".
