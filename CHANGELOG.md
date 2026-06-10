# Histórico de versões — Louvai 🎸

App de cifras offline-first para ministério de música. Versionamento semântico
(`vMAIOR.MENOR.CORREÇÃO`): CORREÇÃO = conserto, MENOR = recurso novo, MAIOR =
mudança grande/incompatível. A versão atual aparece dentro do app, ao lado do nome.

> O projeto se chamou **Levita** até a v0.8.0 (as notas antigas usam esse nome).

---

---

---

---

---

---

---

---

## v0.17.0 — Grafia fiel ao tom ao transpor (fim do botão ♯/♭ manual)
**Recurso (qualidade da cifra).** Continuação da v0.16.0.
- **O incômodo:** ao transpor, a grafia saía de um **botão manual ♯/♭** que valia
  pra tudo, ignorando o tom de destino. Resultado: transpor pro tom de Fá podia
  mostrar `A#` onde o certo é `Bb`. O dono pediu que o app **represente fielmente o
  tom** e propôs tirar o botão, deixando só **subir/abaixar**.
- **A correção:** a grafia agora vem do **tom**, não de um botão. A transposição
  **preserva o intervalo** (a letra do acorde anda junto com o tom), então uma
  cifra escrita certo continua certa — `Bb` sobe pra `C`, vai pra `Eb` no tom de
  Fá, e **nunca vira `A#`**. Isso vale até pra **acordes emprestados** (o clássico
  `Bb` no tom de Dó), que uma regra simples de "tom usa ♯ ou ♭" erraria.
  - Novas peças na fonte da verdade: `noteParts`, `transposeKeyName` (escolhe o
    nome de tom legível, ex.: Dó#+2 → **Mib**), `spellCtx` (deriva `letterStep` do
    par tom-origem→tom-destino) e `transposeNote` reescrito (anda a letra, ajusta o
    acidente; se o resultado ficar ilegível — dobrado, `Cb`/`Fb`/`B#`/`E#` — cai no
    enarmônico simples do lado do tom).
  - Cabeçalho "Tom:" e corpo da cifra podem usar grafias diferentes com **capo**
    (tom que soa × tom da forma) — cada um deriva seu contexto.
  - **A escala manda na grafia:** se o culto fixa o tom em `Bb`, aparece em bemol;
    a escolha do usuário vence a tabela automática.
- **Removido:** o toggle "Sustenido / bemol" do ⚙ Ajustes (e `acc()`/`soundingKey()`).
- **Mantido (v0.16.0):** sem transposição, a cifra aparece **como foi escrita**.
- **Guarda de regressão:** novos testes puros — emprestado `Bb`→`C`; tom de Fá
  `F`→`Eb`; tom de Rém `C`→`Bb` (o A# some); menor bemol `F`→`Ab`/`G`→`Bb`;
  origem bemol e `C#` resgatadas; escala com grafia explícita; e a preservação em
  zero/oitava da v0.16.0 continuando válida.
- Validado: **70 verificações**, zero erro de JS.

---

## v0.16.0 — Preservar a grafia original dos acordes (Bb continua Bb até transpor)
**Recurso (qualidade da cifra).**
- **O incômodo:** uma cifra escrita com bemóis (`Bb`, `Eb`, `Gb`…) aparecia com
  sustenidos (`A#`, `D#`, `F#`) **sem ter transposto nada** — só porque a
  preferência padrão de exibição é ♯. O contrário também: quem ligava ♭ via os
  sustenidos do autor virarem bemóis. A grafia que o ministério escreveu/importou
  se perdia na tela, no cabeçalho "Tom:" e na linha "forma em" do capo.
- **A correção:** `transposeNote` — a função única por onde passam exibição,
  cabeçalho e capo — agora **devolve a nota como foi escrita quando não há
  transposição** (`semis % 12 === 0`, o que inclui mover por oitavas). A
  preferência ♯/♭ só re-soletra os acordes **ao transpor de verdade**. Bate com a
  intenção: *"Bb continua Bb até transpor"*. Voltar ao tom original (ex.: +2 e −2)
  restaura a grafia do autor de graça.
- **Por que na fonte da verdade:** a mudança vive numa só função; `transposeChord`,
  `soundingKey` e a forma do capo herdam o comportamento sem duplicar regra.
- **Guarda de regressão:** novos testes puros — `Bb`/`F#`/`D/Bb` preservados sem
  transpor (com preferência oposta), oitava (12) não re-soletra, e ao transpor +2
  a preferência volta a valer (`Bb`→`C`).
- Validado: **64 verificações** (6 novas), zero erro de JS.
- *Próximo da mesma família (backlog):* grafia inteligente **ao** transpor
  (sustenido/bemol conforme o tom de destino).

---

## v0.15.1 — Correção do Modo Página no celular (paginação fragmentada)
**Correção (crítica do Modo Página).** Pega na validação em dispositivo real.
- **Bug:** em vários celulares, uma cifra no Modo Página quebrava em **uma linha por
  página** — uma música chegou a virar ~148 páginas. Causa: a altura útil da página
  (`avail`) é fracionária (ex.: 560,8px), mas o `scrollHeight`/`clientHeight` que o
  navegador devolve são **inteiros**; o arredondamento (561) passava de 560,8 e o app
  achava que a página tinha estourado **antes de caber qualquer conteúdo**, quebrando
  a página a cada unidade. Dependia da fração de pixels do aparelho — por isso passava
  no teste (viewport 412×915) e falhava no celular (390×844 → 560,8125px).
- **Correção:** o teste de estouro agora compara `scrollHeight` com `clientHeight`
  (ambos inteiros e do **mesmo** elemento) — o teste canônico de overflow, imune a
  sub-pixel. As páginas voltam a empacotar ~15-20 linhas, como esperado.
- **Guarda de regressão:** novo teste num viewport de celular (390×844, o que
  reproduzia o bug) exige que a paginação empacote várias linhas por página.
- Validado: **58 verificações** (nova: empacotamento por página no celular), zero
  erro de JS.

## v0.15.0 — Modo Página (modos de leitura, parte 2)
**Recurso novo (UX de palco).** Segundo e último incremento dos modos de leitura
(ver `PLANO-modos-leitura.md`) — fecha o tema.
- **Novo modo "Página":** em vez de rolar, a cifra vira **páginas horizontais**
  estilo livro. Vira a página **deslizando** (scroll-snap nativo) ou **tocando** na
  metade direita (avança) / esquerda (volta). Indicador discreto "p / N".
- **Seletor "Rolagem | Página"** no sheet ⚙ Ajustes (preferência salva em
  `settings.readMode`). No modo página, a barra de auto-scroll some (não faz sentido).
- **Fatiamento inteligente:** as páginas são montadas medindo a altura **real** no
  DOM (lida com qualquer fonte/tela) a partir da saída do `renderCifra` (fonte única,
  não reimplementada). **Unidades atômicas** garantem que um acorde nunca se separa
  da sua letra e que um cabeçalho de seção nunca termina a página sozinho.
- A navegação por **estrutura (☰)** salta para a página da seção; mudar a fonte e os
  toggles **recalculam** a paginação; girar o aparelho re-fatia.
- **Robustez (revisão adversarial):** seções instrumentais sem linha em branco não
  colapsam mais numa página única; o fatiamento respeita o indicador e a safe-area
  (nada some abaixo da dobra em paisagem); um toque parado mais demorado ainda vira a
  página; ao sair do player o estado de página é limpo.
- *Limitações conhecidas (v1):* uma unidade isolada mais alta que a tela pode cortar;
  linhas muito longas são cortadas na horizontal (sem rolagem dentro do slide).
- Validado: **57 verificações** (novas: paginação ≥2, toque avança/volta, anti-órfã,
  voltar pra rolagem, fonte recalcula, instrumental não colapsa), zero erro de JS.

## v0.14.0 — Auto-scroll opcional (modos de leitura, parte 1)
**Recurso novo (UX de palco).** Primeiro dos dois incrementos dos modos de leitura
(ver `PLANO-modos-leitura.md`).
- A **barra de auto-scroll** (▶ + velocidade) deixou de ficar sempre na tela: agora
  é **opcional e oculta por padrão**. Quem rola a cifra na mão ganha mais tela; quem
  gosta do auto-scroll liga num toque.
- Novo interruptor **"Mostrar barra de auto-scroll"** no sheet ⚙ Ajustes (mesmo
  padrão dos outros toggles). A preferência fica salva no aparelho
  (`settings.showScrollbar`).
- Ao desligar a barra, a rolagem em curso **para sozinha** e o respiro inferior da
  cifra encolhe — sem mexer no alinhamento monoespaçado acorde/letra.
- Próximo incremento (v0.15.0): **Modo Página** (virar páginas em vez de rolar).
- Validado: **48 verificações** (novas: barra oculta por padrão; ligar no ⚙ Ajustes
  faz a barra aparecer), zero erro de JS.

## v0.13.2 — Robustez, segurança e acessibilidade
**Correção (blindagem antes de distribuir).** Faxina de qualidade guiada por uma
revisão multi-dimensional do código (correção, robustez, qualidade e acessibilidade),
sem novos recursos — os modos de leitura (v0.14.0+) seguem reservados.
- **Segurança — XSS por arquivo:** `esc()` passou a escapar também aspas (`"`/`'`).
  Antes, uma escala recebida do grupo (`.json`) com aspas no nome de alguém da equipe
  ou nas observações de um item podia fechar o atributo `value="…"` e injetar
  HTML/script ao abrir o editor daquela escala. Agora `esc()` é a fonte única de
  escape para texto **e** atributos.
- **Robustez — arquivo malformado não derruba o app:** `esc()` tolera valores
  não-string e a importação normaliza os tipos (ex.: título numérico). Um `.json`
  estranho não trava mais a lista de cifras; a ordenação por título também ficou
  à prova de dados antigos.
- **Re-importar escala não duplica:** importar a mesma escala (ou uma versão
  corrigida) agora **atualiza** a existente por `id` — como já acontecia com as
  cifras — em vez de empilhar cópias. As cifras que vêm junto aparecem na aba Cifras
  na hora (antes só depois de buscar/recarregar).
- **Corretor mais esperto:** o aviso "não reconheci como acorde" parou de acusar
  palavras da letra começadas por nota (Deus, Glória, Cristo, Amor…). Só alerta o que
  **tem forma de acorde** e não é um (ex.: `Cg`) — fiel à gramática generosa.
- **Exemplo não ressuscita:** depois de esvaziar o repertório de propósito, a cifra
  de exemplo não volta a cada abertura (semeada só numa instalação nunca inicializada).
- **Importar à prova de erro de leitura:** falha do `FileReader` agora avisa e libera
  re-selecionar o mesmo arquivo (antes era um erro silencioso).
- **Acessibilidade:** botões só-ícone ganharam nome acessível (`aria-label`); os
  toggles (só-letra, tablaturas, ♯/♭) expõem o estado ligado/desligado (`aria-pressed`);
  o app respeita o "Reduzir movimento" do sistema; e os alvos de toque pequenos da
  ordem do culto (↑/↓/✕) e o slider de velocidade cresceram para o padrão de palco.
- **Casa arrumada:** a coreografia de abrir/fechar dos painéis (sheets) foi
  centralizada num par de funções; o comentário de cabeçalho que ainda dizia "LEVITA"
  foi corrigido para "Louvai".
- Validado: **47 verificações** (8 novas: escape de aspas, tolerância a não-string,
  dedup de escala, lint poupando a letra, exemplo não ressuscita, nome acessível +
  `aria-pressed`, "Reduzir movimento"), zero erro de JS.

## v0.13.1 — Contraste da cifra no modo escuro
**Correção (legibilidade no palco).**
- **Problema:** no dark, acorde (violeta-claro) e letra (branco) tinham
  luminosidade parecida — de longe se confundiam, atrapalhando a execução
  durante o culto. No claro estava bom.
- Agora o acorde fala mais alto em três camadas: **violeta mais vivo**, um
  **chip de fundo sutil** atrás do acorde e um **halo de brilho** (pensado para
  palco escuro); a letra desceu um tom do branco puro (84%) — continua com
  contraste altíssimo com o fundo, mas não compete com o acorde.
- O chip não tem padding lateral de propósito: o alinhamento monoespaçado
  acorde-sobre-letra não se move um pixel.
- O modo claro ficou como estava (chip e halo desligados por token).
- Validado: 39 verificações (nova: acorde ≠ letra em cor e com chip no dark),
  zero erro de JS.

## v0.13.0 — Redesign, Fase 4: escalas, editor e polimento (fim do redesign)
**Recurso novo (visual/UX).** Última fase do redesign (ver `PLANO-redesign-ui.md`).
- **Formulários com foco violeta:** inputs/selects/textarea ganham borda de
  acento + anel suave ao focar (editor de cifra e de escala).
- **Vidro fosco** nos sheets e no toast (blur denso, translúcido) — coerente
  com a topbar e a bottom nav.
- **Fluidez entre telas:** cada view entra com fade curto (220ms, só opacidade
  — não desloca elementos fixos).
- **Empty states com personalidade:** nota musical violeta com brilho quando a
  lista está vazia.
- Microinterações padronizadas no token `--dur` (200ms); cantos dos sheets no
  raio maior (`--r-lg`).
- Validado: 38 verificações (nova: sheets com backdrop blur), zero erro de JS.

## v0.12.0 — Redesign, Fase 3: player focado no palco
**Recurso novo (visual/UX).** Terceira fase do redesign (ver `PLANO-redesign-ui.md`).
- **Barra do player enxuta:** ao vivo, só o que importa fica à vista — **Tom**
  (♭ / tom / ♯) e o auto-scroll na base. A barra ficou mais baixa, sobrando mais
  tela para a cifra.
- **Sheet "⚙ Ajustes":** Capo, tamanho da fonte, só-letra, tablaturas e ♯/♭
  agora moram num painel que sobe da base — são ajustes que você define antes
  de tocar, não durante. Os controles mantêm os mesmos IDs e funções (~10
  linhas de JS aditivas, só para abrir/fechar o painel).
- A navegação por estrutura (☰) se adapta sozinha à barra mais baixa (o offset
  do scroll é medido em tempo real).
- Validado: 37 verificações (novas: Tom/auto-scroll à vista, capo dentro do
  sheet funcionando, abre/fecha do painel), zero erro de JS.

## v0.11.0 — Redesign, Fase 2: navegação repensada
**Recurso novo (visual/UX).** Segunda fase do redesign (ver `PLANO-redesign-ui.md`).
- **Bottom nav fixa** estilo Spotify: as abas **Cifras | Escalas** saíram do meio
  da tela e viraram uma barra de navegação na base, com vidro fosco (blur),
  ícone + rótulo e área segura (notch/home indicator). Some sozinha nas telas
  de detalhe.
- **Botão "+" único e contextual** (FAB circular): cria cifra na aba Cifras e
  escala na aba Escalas — no lugar dos 2-3 botões largos que ocupavam a base.
- **Backup subiu para a topbar** (ícone ↥ ao lado de importar): ação rara não
  precisa de destaque permanente. Única mudança de JS: a linha que
  escondia/mostrava o botão por aba foi removida.
- Toast e listas reposicionados para não colidir com a barra nova.
- Validado: 32 verificações (novas: nav visível na biblioteca e ausente no
  player, FAB e Backup acessíveis), zero erro de JS.

## v0.10.0 — Redesign, Fase 1: nova identidade visual (fundação)
**Recurso novo (visual).** Primeira de 4 fases do redesign (ver `PLANO-redesign-ui.md`).
- **Paleta nova:** fundo neutro quase-preto em camadas de brilho (estilo
  Spotify/Deezer) no lugar do marrom/dourado; **acento violeta** (worship) em
  botões, toggles ativos, acordes e no dot do logo — definido num token único
  (`--accent`), fácil de trocar.
- **Fundo com atmosfera:** brilho violeta sutil no topo que se dissolve no
  escuro (sem o radial dourado antigo).
- **Tipografia modernizada:** UI em **Inter** (títulos em peso forte);
  **Fraunces** (serif) agora é exclusiva do logo "Louvai" — o selo da marca;
  cifra continua em **JetBrains Mono**. Fallbacks offline preservados.
- **Toque melhor:** botões de ícone e controles do player com alvos ≥48px.
- Tema claro re-derivado dos mesmos tokens (violeta mais escuro p/ contraste).
- Zero mudança de comportamento: todos os IDs/fluxos preservados; única linha
  de JS tocada foi a cor do `<meta theme-color>`.
- Validado: 28 verificações (nova: fundo usa a paleta `#121212`), zero erro de JS.

## v0.9.0 — Renomeado: Levita agora é Louvai
**Mudança de nome (com compatibilidade total).**
- O app passa a se chamar **Louvai** — "louvai" convida todos a adorar, sem
  remeter à tribo levítica. Novo título, cabeçalho e nome de arquivo
  (`louvai.html`).
- **Nada se perde:** o boot migra automaticamente os dados gravados pelo nome
  antigo (`levita.*` → `louvai.*` no localStorage), e a importação aceita tanto
  arquivos novos (`louvai-song`, `louvai-library`, `louvai-escala`) quanto os
  antigos (`levita-*`).
- Exportações novas já saem com os identificadores `louvai-*`.
- Documentos renomeados/atualizados (README, CLAUDE.md, `ROTEIRO-louvai.md`).
- Validado: 27 verificações, incluindo importar arquivo antigo `levita-song` e
  migração do localStorage; zero erro de JS.

## v0.8.0 — Wake Lock (tela acesa no player)
**Recurso novo.**
- Ao abrir uma cifra no player, o app **pede ao sistema para manter a tela
  acesa** (Wake Lock) — a tela não apaga mais no meio do louvor. Ao sair do
  player, a trava é liberada e a tela volta a apagar normalmente.
- Se você trocar de app e voltar, a trava é **readquirida sozinha** (o sistema
  sempre a solta quando o app sai de primeiro plano).
- Em navegadores sem suporte (ou com economia de bateria agressiva), o app
  segue funcionando normalmente — o recurso degrada em silêncio.
- Validado: stub do Wake Lock na suíte E2E (pede ao abrir, solta ao sair),
  24 verificações no total, zero erro de JS.

## v0.7.1 — Correção do menu de estrutura
**Correção.**
- **Bug:** em músicas com muitas seções, o menu ☰ Estrutura crescia para cima e
  ficava sem rolagem — as primeiras seções (Intro, etc.) ficavam fora da tela e
  inacessíveis.
- Agora a folha tem altura máxima e o conteúdo **rola**, com a primeira seção
  sempre acessível.
- O menu de estrutura também passou a **ignorar os cabeçalhos `[Tab - …]`**
  (não são seções de navegação).
- Validado com música de 22 seções: 8 verificações, zero erro de JS.

## v0.7.0 — Navegação por estrutura da música
**Recurso novo.**
- Botão **☰ Estrutura da música** no player: abre a lista das seções da cifra
  (Intro, Verso, Refrão, Ponte, Final…) e, ao tocar numa delas, **rola suave**
  até aquela seção — já descontando a barra fixa do topo.
- Reconhece tanto seções sozinhas (`[Refrão]`) quanto seções com acordes na
  mesma linha (`[Intro] C7M G/B…`).
- Seções repetidas são numeradas (ex.: "Refrão ·1", "Refrão ·2") para você pular
  para a ocorrência certa.
- Se a cifra não tiver seções marcadas, avisa em vez de abrir um menu vazio.
- Validado: suíte E2E (lista, repetição numerada, rolagem ancorada à barra,
  caso sem seções), zero erro de JS.

## v0.6.0 — Ocultar tablaturas + limpeza no colar
**Recurso novo + correção.**
- **Botão "Tabs"** no player: oculta/mostra as tablaturas (linhas `E|--…`, os
  cabeçalhos `[Tab - …]` e os rótulos "Parte X de Y") para uma leitura limpa no
  palco. As tabs continuam guardadas — é só exibição. A preferência fica salva.
- **Correção do colar:** linhas como `Cifra: Principal (violão e guitarra)
  Favoritar Cifra` (cabeçalho da página do Cifra Club) eram incluídas no corpo
  da cifra. Agora são reconhecidas como metadado e removidas na importação.
- Validado com texto real colado: 14 verificações, zero erro de JS.

## v0.5.1 — Ajuste no colar do Cifra Club
**Correção.**
- **Bug:** quando a cifra começava com `[Intro] C7M G/B…` (rótulo de seção e
  acordes na MESMA linha, padrão do Cifra Club), o app não reconhecia a linha
  como seção e mandava o "[Intro]…" para o campo **Título**.
- Agora o parser trata qualquer linha que comece com `[rótulo]` como estrutura
  (nunca como título), e o exibidor renderiza `[Seção] + acordes` na mesma linha
  — rótulo destacado e acordes coloridos (vale para Intro, Solo, Interlúdio, Final…).
- Validado com o texto real colado do Cifra Club: 11 verificações, zero erro de JS.

## v0.5.0 — Importar colando texto (Cifra Club etc.)
**Recurso novo.**
- Botão **“Colar cifra pronta”** ao criar uma nova cifra: você cola o texto
  copiado (ex.: do Cifra Club) e o app **reconhece automaticamente** título,
  artista, tom e capotraste, e limpa o lixo (URLs, “Cifra Club”, linhas de
  metadado), preenchendo o editor.
- Quando não há “Tom:” no texto, o tom é **inferido do primeiro acorde** (inclui
  menores, ex.: Em).
- Filosofia: nada é salvo no escuro — o resultado cai no formulário editável
  (com o corretor de acordes) para você conferir e ajustar antes de salvar.
- O botão fica oculto ao editar uma cifra já existente (evita sobrescrever).
- Validado: 19 verificações no parser (5 formatos de colagem) + suíte E2E no
  navegador, zero erro de JS.

## v0.4.1 — Correção do compartilhamento
**Correção.**
- **Bug:** ao compartilhar uma cifra em alguns navegadores/contexto `file://`,
  a checagem do compartilhamento nativo (`navigator.canShare`) podia lançar
  exceção e escapar sem cair no download — gerando erro ao clicar em ↗.
- Agora o compartilhamento é à prova de falhas: tenta o nativo (celular) e, em
  qualquer erro, baixa o arquivo automaticamente. Cancelar continua sendo
  respeitado (não baixa). Vale para cifra, escala e backup do repertório.
- Validado: 8 verificações cobrindo 4 cenários (exceção, rejeição genérica,
  cancelamento e ausência de Web Share).

## v0.4.0 — Escalas / Setlists (ordem do culto)
**Recurso novo (grande).** Baseado nos melhores recursos de Planning Center,
OnSong e dos apps brasileiros (LouvorAPP, LouveApp, iPraise).
- Nova aba **Escalas**, separada das Cifras.
- Montagem do **culto/ensaio**: título, data, hora e tipo (Culto, Ensaio, Ceia…).
- **Ordem do culto** com músicas E itens não-musicais (avisos, oração, palavra,
  ceia) — como o "order of service".
- **Tom e capo por escala**: cada música guarda o tom daquele culto sem alterar
  a cifra original (o recurso mais elogiado dos apps de referência).
- **Momento** por item (Abertura, Adoração, Ceia, Oferta…), **duração** por item
  e **tempo total** estimado do culto.
- **Escala de pessoas** por função (Ministrante, Vocal, Violão, Teclado, Baixo,
  Bateria…).
- Reordenar itens (↑/↓) e seletor de música a partir do repertório.
- **Modo Apresentar**: abre música a música já no tom do culto, com navegação
  anterior/próxima e contador "X de N".
- **Compartilhar escala** num arquivo que já leva as cifras junto; importação
  reconhece o arquivo e mescla as cifras automaticamente.
- Validado: suíte E2E com 21 verificações em navegador real, zero erro de JS.

## v0.3.0 — Fonte da verdade de acordes + corretor no editor
**Recurso novo.**
- Criada a função `parseChord()` como **fonte única da verdade** do que é um
  acorde válido (fundamental + alteração + qualidade/extensões + baixo `/X`).
  Usada em exibição, transposição e validação. Fácil de estender.
- Editor passou a ter um **corretor não-bloqueante**: avisa ao vivo quando um
  token parece acorde mas não é reconhecido (ex.: `Gx`), apontando exatamente
  o que está errado. A letra continua livre para digitar.
- Ao salvar com acordes não reconhecidos, o app pede confirmação ("Salvar mesmo
  assim?") listando os tokens.
- A versão do app passou a ser carimbada nos arquivos exportados (`app`).
- Validado: 134/134 na bateria da gramática; suíte E2E em navegador real.

## v0.2.0 — Correção crítica de usabilidade
**Correção.**
- **Bug grave:** uma camada invisível (`#sheetbg`) cobria a tela inteira e
  engolia todos os toques/cliques — o app abria mas nenhum botão respondia, no
  celular e no desktop. Corrigido com `pointer-events` desligado quando fechada.
- Gravação de dados blindada com `try/catch` (modo privado / `file://`).
- Validado de ponta a ponta em Chromium real (criar cifra, transpor, capo,
  buscar, persistir após recarregar).

## v0.1.0 — Primeira versão
**Marco inicial.**
- Biblioteca de cifras com busca e filtro por tags.
- Player: acordes sobre a letra, transposição (♯/♭), capo, tamanho de fonte,
  modo escuro/claro, modo "só letra", rolagem automática com velocidade.
- Editor: criar, editar e excluir cifras (título, artista, tom, capo, tags).
- Tudo salvo no aparelho (offline). Compartilhamento por arquivo `.json`
  (cifra única ou repertório inteiro), com importação e merge inteligente.

---

## Como manter o histórico daqui pra frente
A cada incremento:
1. Anoto a mudança aqui em cima, numa nova versão.
2. Atualizo o número em `APP_VERSION` (dentro do `levita.html`).
3. Faço um commit no git com a mensagem da versão.
4. Você recebe o arquivo nomeado com a versão (ex.: `levita-v0.4.0.html`).
