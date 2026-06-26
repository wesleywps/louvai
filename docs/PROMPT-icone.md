# Prompt — ícone do app (para o Claude design)

> Prompt dedicado para gerar o **ícone de aplicativo do Louvai** (incl. variante
> PWA: 192/512 + maskable + apple-touch 180 — ver `PLANO-pwa.md`). Montado a partir
> da identidade visual real do `louvai.html` (paleta `#121212` + violeta `#a78bfa`/
> `#8b5cf6`/`#c7a9ff`, wordmark serifado Fraunces, atmosfera de brilho violeta) e do
> domínio (cifras + escalas para ministério de louvor, uso no palco em pouca luz).
> Cole o bloco abaixo no Claude (modo design/geração de imagem).

---

```
Você é um designer de identidade visual. Crie o ÍCONE DE APLICATIVO do "Louvai".
Gere algumas variações e me entregue uma versão final refinada.

## O que é o app
Louvai é um app de cifras e escalas (setlists) para o MINISTÉRIO DE LOUVOR de uma
igreja. Offline-first, roda no celular/tablet, usado AO VIVO NO PALCO, em pouca luz.
Organiza o repertório, monta a escala do culto e mostra a cifra (acordes sobre a
letra) na hora de tocar. É um app instalável (PWA): o ícone vai ficar na tela
inicial do celular, ao lado de apps nativos.

## Significado do nome (guia o símbolo)
"Louvai" é o imperativo de louvar — um CONVITE A TODOS ADORAREM. Não remete a uma
classe/tribo de músicos. O símbolo deve evocar LOUVOR + MÚSICA (algo elevado,
acolhedor, reverente), e não "guitarra/banda" nem nada litúrgico pesado. Tom:
caloroso, sério mas não solene, feito pra músico de igreja.

## Identidade visual já existente (siga à risca)
- Fundo da marca: NEAR-BLACK #121212, com um brilho radial VIOLETA suave saindo do
  topo e dissolvendo no preto (atmosfera, não "flat genérico").
- Cor de acento (a alma da marca): VIOLETA. Tons exatos usados no app:
  #a78bfa (violeta claro), #8b5cf6 / #7c3aed (violeta forte), #c7a9ff (violeta vivo
  do acorde). Use essa família de violetas como cor principal do símbolo.
- A marca tem um wordmark em SERIF elegante (tipo Fraunces) — o símbolo pode
  conversar com essa pegada serifada/editorial, mas o ícone NÃO precisa conter texto.
- O restante da UI usa traço limpo estilo Lucide (2px, monocromático). O ícone pode
  ser mais cheio/sólido que isso (ícone de app precisa de peso pra ler pequeno).

## Conceito (recomendado + alternativas)
PRINCIPAL — Monograma + música: um "L" serifado (eco do wordmark) que se funde
discretamente com um elemento musical (uma cabeça de nota / uma nota suave no
terminal ou no contraforma do L), banhado pelo brilho violeta. Distinto, ligado à
marca e legível em tamanho mínimo.

Alternativas (gere também, pra eu comparar):
(B) Mãos erguidas/abertas em adoração sustentando ou liberando uma nota musical que
    brilha — o sentido mais literal de "louvai" (louvor) + música.
(C) Um cancioneiro/livro aberto com uma página virando (o app tem modo "página" e
    metáfora de "livro") e uma nota/luz violeta subindo dele.

Escolha o que ficar mais forte e icônico; pode combinar ideias. Evite literalidade
excessiva — quero uma MARCA, não uma ilustração detalhada.

## Requisitos técnicos (ícone de PWA — obrigatório)
- Quadrado, composição CENTRADA, simples e de alto contraste. Tem que ler bem a
  ~48px (tela inicial) e a 512px.
- Entregar pensando em 3 usos:
  1) ícone normal 512×512 e 192×192 (símbolo violeta sobre fundo near-black #121212);
  2) versão MASKABLE: mesmo símbolo, mas com ZONA DE SEGURANÇA — todo o conteúdo
     essencial dentro dos ~80% centrais (margem de ~10% em volta), porque o sistema
     pode recortar em círculo/squircle. Fundo deve sangrar até a borda (sem
     transparência), preenchido com o near-black + leve brilho violeta.
  3) apple-touch 180×180 SEM transparência (o iOS arredonda sozinho).
- Cores casadas com o manifesto: theme_color e background_color = #121212.
- Funcionar perfeitamente no ESCURO (é onde vive); poucas cores, formas grandes,
  silhueta limpa. Um único símbolo dominante.

## O que evitar
- Texto/letras soltas (exceto o "L" SE for o conceito do monograma).
- Visual genérico de IA: degradês arco-íris, brilho exagerado, "glassmorphism"
  aleatório, sombras pesadas, fundo branco, clip-art de violão/microfone, cruzes
  ou símbolos religiosos pesados, emoji.
- Detalhe fino que some no tamanho pequeno; ruído; mais de 2–3 cores.

## Entregáveis
1) 3–4 conceitos em miniatura (mostrando que leem pequeno).
2) O conceito escolhido finalizado: visão normal (sobre #121212) e visão maskable
   (com a margem de segurança e o fundo sangrando).
3) Uma linha explicando o conceito e por que ele representa o Louvai.
```

---

## Depois de gerar — instalar os ícones no app (NÃO esqueça)

> O prompt acima produz **imagens**; o PWA precisa de **arquivos PNG** nos tamanhos exatos,
> salvos no lugar certo e **destravados no git**. Estes são os passos que ligam o design ao
> app — o detalhe que some fácil, registrado aqui de propósito. Contexto em `PLANO-pwa.md`
> (decisão **D2** + Incremento 1).

> **✅ Status: ícones gerados e commitados** na pasta **`louvai-icons/`** (via este prompt).
> Os passos abaixo já foram aplicados — ficam registrados pra repetir/atualizar no futuro.

**1. PNGs em `louvai-icons/`** (nomes e tamanhos **reais** — é o que o `manifest`/`louvai.html` procuram):

| Arquivo | Tamanho | Uso | Observação |
|---|---|---|---|
| `louvai-icons/icon-192.png` | 192×192 | ícone normal | símbolo violeta sobre `#121212` |
| `louvai-icons/icon-512.png` | 512×512 | ícone normal / splash | idem |
| `louvai-icons/icon-maskable-192.png` | 192×192 | **maskable** (Android recorta) | conteúdo nos **~80% centrais**; fundo sangrando |
| `louvai-icons/icon-maskable-512.png` | 512×512 | **maskable** | idem, em alta |
| `louvai-icons/apple-touch-180.png` | 180×180 | iOS (tela inicial) | **sem transparência** (o iOS arredonda sozinho) |

Fonte vetorial junto: `louvai-icons/louvai-icon.svg` e `louvai-icon-maskable.svg`. ⚠️ O
`louvai-icons/manifest.json` é **rascunho do gerador** (`start_url:"/"`) — o Inc.1 cria o
`manifest.webmanifest` correto na **raiz** (`start_url:"./"` + `scope`/`id`).

**2. Destravar no `.gitignore`** — ⚠️ **o ponto que mais confunde:** a linha `*.png` (linha 2)
**ignora todo PNG por padrão**, então os ícones **não entram no git sozinhos**. Adicione:

```
!louvai-icons/*.png
```

Só isso. **Não** use `!louvai-icons/` (é redundante — `*.png` casa arquivos, não a pasta).
**Confira que destravou:** `git status` deve listar os ícones como novos; e
`git check-ignore louvai-icons/icon-192.png` **não** pode retornar nada (saída vazia = não ignorado).

**3. Onde eles são referenciados** (já previsto no Inc.1 do `PLANO-pwa.md`):
- `manifest.webmanifest` → array `icons` com 192, 512 e o **maskable-512** (este com
  `"purpose": "maskable"`; os outros, `"any"`).
- `louvai.html` → `<link rel="apple-touch-icon" href="louvai-icons/apple-touch-180.png">`.
- Caminhos **relativos** (`louvai-icons/…`) resolvem para `/louvai/louvai-icons/…` em produção e
  funcionam em **qualquer fork** (mesma lógica fork-safe do `defaultRepoUrl` da v0.45.0).

**4. Sem etapa de build:** exporte os PNGs **à mão** (a partir da imagem/SVG gerado) **ou** com
um `scripts/gen-icons.mjs` **pontual** (rodado à parte — **não** é build do app; o runtime segue
sem dependências).
