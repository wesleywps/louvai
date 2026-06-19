# Histórico de versões — Louvai 🎸

App de cifras offline-first para ministério de música. Versionamento semântico
(`vMAIOR.MENOR.CORREÇÃO`): CORREÇÃO = conserto, MENOR = recurso novo, MAIOR =
mudança grande/incompatível. A versão atual aparece dentro do app, ao lado do nome.

> O projeto se chamou **Levita** até a v0.8.0 (as notas antigas usam esse nome).

---

## v0.44.2 — Índice de seções no `<script>` (navegação)
**Organização (sem mudança de comportamento).** Adicionado um **índice de seções** no topo do `<script>`
(`ÍNDICE DO SCRIPT`) que lista, na ordem, os grandes blocos do arquivo único — basta dar Ctrl+F no nome
da seção para pular até ela. Espelha o "Anatomia do louvai.html" do `CLAUDE.md`. Só comentário: nenhuma
lógica ou nome mudou; **263 verificações**, zero erro de JS. *(Fatia segura de uma frente maior de
organização — o refactor completo, com nomes/agrupamento, fica para uma sessão dedicada; ver `ROTEIRO`.)*

---

## v0.44.1 — Correções: data do culto realizado + título/autor na importação
**Correção.**
- **"Culto realizado" usa a DATA da escala**, não o dia do clique. Como a confirmação pode ser feita
  **dias depois** do culto, a recência ("tocada há…") reflete o **dia do culto** (campo Data). Quando a
  escala **não tem data**, usa o dia em que se sinalizou (hoje) como execução — *decisão do dono
  (2026-06-19)*. (A recência já vinha de `buildLastPlayed`/`e.date`; mantido o fallback de hoje só p/
  escala sem data.)
- **Importar "Intro: <acordes>" não vira mais título/autor.** Uma linha de **rótulo de seção seguida de
  acordes** na mesma linha (ex.: `Intro: Em C D Em - Em C D Em`) era capturada como título — e o ` - ` do
  meio ainda virava "Título - Autor". Novo `sectionChordLead` reconhece "rótulo + acordes" (`[Sec]`,
  `Sec:` ou palavra de seção) como **estrutura** — **só** quando o resto é linha de acordes (um título
  real como "Solo na Montanha" não casa) — e encerra o cabeçalho; o traço solto (`-`/`–`/`—`) passou a
  ser **neutro** em linha de acordes. Resultado: título/autor ficam **vazios** pro usuário preencher e a
  linha segue no corpo.
- **263 verificações** (4 novas), zero erro de JS.

---

## v0.44.0 — Modo tela cheia na Apresentação
**Recurso (Apresentação ao vivo).** Botão de **tela cheia** na barra compacta da Apresentação: **maximiza
a cifra** na tela do palco — esconde a barra e a linha de info (cabeçalho) e ainda **pede o Fullscreen do
navegador** (recupera a barra do navegador no Android/desktop; iOS, que não suporta, degrada sem erro).
- Navegar entre músicas segue por **virar-página / ‹ ›**; sair pelo **botão flutuante** no canto — fora da
  zona de toque de virar-página, sem conflito. O Wake Lock mantém a tela acesa.
- Sair do player **ou** sair do fullscreen pelo sistema (Esc/gesto) volta o layout automaticamente.
- `#pv-full` (alterna `maximize`/`minimize`), `#pv-exitfull` flutuante; `setImmersive`/`toggleImmersive`
  (classe `.immersive` em `#view-player`) + Fullscreen API com prefixo `webkit` e `try/catch`.
- **259 verificações** (4 novas: botão presente, esconde barra + mostra sair, pede Fullscreen, sair volta),
  zero erro de JS.

---

## v0.43.2 — Acessibilidade: foco por teclado, alvo de toque e contraste
**Ajuste (acessibilidade).** Fecha os três itens de acessibilidade que sobraram da análise de UI:
- **Foco visível por teclado** (`:focus-visible`): botões, chips, links e os **cards** (lista de cifras/
  escalas e seletor) ganham um anel de foco com o acento — só no foco **por teclado**, não no toque/clique.
  Os cards passaram a ser **acessíveis por teclado** (foco + **Enter/Espaço** ativam), via helper
  `clickable` (`role="button"`/`tabindex=0`).
- **Alvo de toque da tagbar ≥44px:** as `.chip` de tag agora têm `min-height:44px` (eram ~30px) — mais
  fáceis de acertar no palco, com pouca luz.
- **Contraste no escuro:** `--muted` subiu de `#b3b3b3` para `#c4c4c4`, deixando o texto secundário
  (artista, recência, contagens) mais legível sobre o fundo escuro.
- **255 verificações** (4 novas: card focável/role, alvo da chip ≥44px, `--muted`, Enter abre o player),
  zero erro de JS.

---

## v0.43.1 — Tom volta pro tile à esquerda (menor)
**Ajuste (UI/lista).** Refinamento da v0.43.0 a pedido: o tom **não muda de lado** — volta ao **tile à
esquerda do nome** da música (a forma de antes, que o líder preferia), só **menor**: de 46×46px para
**38×38px** (mono, gradiente, acento, como era). Sai o chip `.keypill` à direita que a v0.43.0 tinha
introduzido. O resto da compactação **fica**: card em 2 linhas (título / linha cinza com
artista · recência · tags), `padding`/margem enxutos, `min-height` 56px; altura ~58px (cabem mais
músicas). Helper `songCardInner` volta a montar o `.keytag` à esquerda. **251 verificações**, zero erro
de JS.

---

## v0.43.0 — Lista de músicas mais compacta (tom discreto)
**Recurso (UI/lista).** A tela inicial passa a caber mais músicas: o card de cifra ficou em **duas
linhas enxutas** e o tom deixou de ser um tile grande.
- **Base de pesquisa** (Spotify/Apple Music; OnSong/Planning Center; Material 3): linha de lista de
  duas linhas compacta fica em ~56–60px — **comprime o espaço, não a fonte**; o tom é metadado pequeno
  (rótulo/chip cinza), nunca um elemento volumoso; o **alvo de toque é a linha inteira** (≥44px).
- **Tom:** o tile dourado de **46×46px** virou um **chip discreto `.keypill`** (mono, à direita da
  linha do título) — bem menor, ainda legível e identificável.
- **Card em 2 linhas:** título (+ tom à direita) · uma **linha cinza** com **artista · recência · tags**
  (antes: título / artista / faixa de pílulas empilhada). A recência ("tocada há…" / "nunca tocada") e o
  realce "dar vez" da v0.24.0 ficam **inline** na linha cinza (`<span class="played">`/`.never`).
- **Espaço comprimido:** padding vertical 12→8px, margem entre cards 12→8px, `min-height: 56px`
  garantindo o toque. A altura do card caiu de **~74–100px para ~61px** — cabem ~1–3 músicas a mais por
  tela, sem perder legibilidade.
- O `.keytag` saiu; `playedPill` deu lugar a `songSub`/`songCardInner` — **helper único** usado pela
  lista inicial **e** pelo seletor de músicas da escala (ambos ganharam a forma compacta). O `.escard`
  mantém sua gramática `.c-ttl`/`.c-sub`/`.c-meta .pill`.
- **250 verificações** (5 novas: chip do tom, metadados na `.c-sub`, recência inline, altura ≤70px; o
  teste M4 reescrito p/ o card compacto), zero erro de JS.

---

## v0.42.2 — Conferir tom: valida o tom informado por inteiro
**Correção (detecção de tom).** Pequeno endurecimento surfaçado na re-validação: o `compareKey` só
rejeitava tom informado **vazio** ou que **não começasse** com nota; uma string-lixo que por acaso
começa com letra de nota (ex.: `"Gibberish"` → lia como `G`) ainda era comparada e podia acusar
divergência. Agora o guard valida o **token inteiro** como tom (`^[A-G](#/b)?(m)?$`) — qualquer coisa
fora desse formato vira `lowconf` (não opina), em vez de assumir a nota inicial. Só deixa o recurso
**mais conservador** (nunca cria alarme); na prática o `song.key` vem do seletor controlado, então é
blindagem de borda. **245 verificações** (1 nova), zero erro de JS.

---

## v0.42.1 — Correções pós-validação (alarme falso de tom · sync idempotente)
**Correção.** Uma rodada de validação adversarial (3 validadores) pegou dois defeitos reais nas
entregas v0.41.0/v0.42.0, além de dois ajustes finos:
- **Alarme falso de tom (grave) — cifra terminando no IV ou no V.** A v0.42.0 dava o bônus de
  cadência ao acorde final como se ele fosse a tônica. Na folha de louvor mais comum (I–V–vi–IV
  escrita uma vez, ex.: `C G Am F`), o **IV** (F) ganhava o bônus e era eleito tônica → o recurso
  acusava "Tom informado: C · provável: F" numa cifra de **tom certo** (taxa medida ~13% dos casos;
  pior nas músicas mais tocadas no domingo). **Causa:** acorde de fora do diatônico tinha peso 0; o
  tom verdadeiro (que encaixa **todos** os acordes) não se distinguia do IV-como-tônica (que "erra"
  um acorde). **Correção:** pequena **penalidade** para acorde fora do diatônico (`KW_OFF`) + bônus
  do **1º acorde** equiparado ao do último (`KB_FIRST` 1→2). Agora a tonalidade que encaixa tudo
  vence, e os loops ambíguos caem em `lowconf` (sem alarme). Bateria de regressão com as 6 progressões
  I–V–vi–IV / vi–IV–I–V mais comuns + guarda de que o **mismatch genuíno** continua sinalizando.
- **Sync "criava" novidade falsa (médio).** `mergeSongs`/`mergeEscala` contavam como "atualizada"
  qualquer item com `updatedAt ≥` o local — então **re-puxar o mesmo snapshot** (timestamps iguais)
  contava atualização e o **auto-sync silencioso** soltava um toast a **cada reabertura** do app,
  contrariando a promessa da v0.41.0. **Correção:** sobrescreve no empate (nuvem ganha), mas só
  **conta** quando é **estritamente mais novo**. Re-pull idêntico → "Já está tudo sincronizado"
  (manual) e **silêncio** (auto-sync). Teste: dois pulls do mesmo snapshot.
- **`compareKey` com tom informado vazio/inválido** assumia "C" (podia mascarar um mismatch real) →
  agora retorna `lowconf` (não opina).
- **Contraste do aviso de tom no tema claro:** o `#keycheck` em âmbar herdava a cor de fundo escuro;
  no claro usa um âmbar mais escuro (legível com sol no palco), sem mexer no `--warn` do toast.
- **244 verificações** (6 novas), zero erro de JS. Detalhe da calibragem em `PLANO-validacao-tom.md`.

---

## v0.42.0 — Conferir o tom pelos acordes (recurso opcional)
**Recurso (música/teoria).** Confere se o **tom informado** da música (`song.key`) condiz com os
**acordes escritos** na cifra e, quando não condiz, avisa de forma discreta **qual o informado e
qual o provável** ("Tom informado: G · provável pelos acordes: D"). É **ligável/desligável** em
**⚙ Ajustes da cifra → Afinação → "Conferir tom pelos acordes"** (`settings.checkKey`, **off por
padrão**, como o auto-sync). É só **sugestão** — não altera o tom ("nada salvo no escuro"); o músico
decide.
- **Como detecta (teoria pesquisada):** `detectKey(chords)` pontua as **24 tonalidades** (12 maiores
  + 12 menores) por **pertencimento diatônico ponderado**. Tabelas de graus diatônicos `DIA_MAJ`
  (I ii iii IV V vi vii°) e `DIA_MIN` = **união menor natural ∪ harmônica** (aceita o **V maior/V7** e
  o **vii°** da harmônica, além do v/VII naturais — senão músicas menores com V7→i cairiam "fora do
  tom"). A **qualidade tem que casar com a função** (um "Em" é vi de G; um "E" maior não é). **Tônica
  e dominante pesam mais**; o **1º e (sobretudo) o último acorde** dão bônus de cadência — é o que
  separa uma tonalidade da sua **relativa** (mesmas notas, só muda quem é a tônica). Acorde de fora
  (emprestado/secundário) **não pontua mas não penaliza**, então uma ponte cromática não derruba a
  detecção. Reusa `parseChord`/`chordIntervals` (fonte da verdade, regra nº3).
- **Comparação tolerante:** `compareKey(informed, detectado)` → `ok` | `relative` | `mismatch` |
  `lowconf`. **Relativa** (C × Am) e **baixa confiança** (poucos acordes ou progressão ambígua)
  **nunca** viram alarme — honestidade acima de falso-positivo. Só `mismatch` (divergência clara, com
  confiança) acende o aviso.
- **Onde sinaliza:** linha discreta `#keycheck` no ⚙ Ajustes (sob o Tom), cor de **aviso** suave (não
  vermelho — é sugestão). Vale também na importação: ao colar com o recurso ligado, se o "Tom:" do
  texto destoa dos acordes, o toast avisa ("Tom G? os acordes sugerem D").
- **De quebra:** o **palpite de tom da importação** (quando o texto não traz "Tom:") deixou de ser o
  ingênuo "primeiro acorde = tom" e passou a usar `detectKey` (último acorde + função pesam) — com
  fallback pro 1º acorde se a detecção for incerta.
- **Limites assumidos:** sem duração de acorde nem modulação seção-a-seção (centro tonal único, como
  as ferramentas pop); modulação real vira confiança baixa → sem alarme. Os pesos
  (`KW_TONIC`/`KW_DOM`/`KW_DIA`/`KB_FIRST`/`KB_LAST`) são heurísticos e **ajustáveis** — os testes
  travam o **comportamento**, não os números. Ver `PLANO-validacao-tom.md` (teoria + fontes).
- **238 verificações** (17 novas: maior/menor/relativa-por-cadência/sus-add/emprestado/secundário/
  grafia-bemol; `ok`/`relative`/`mismatch`/`lowconf`; `songChords`; toggle off/on/persistência/tom-
  certo; e o palpite da importação), zero erro de JS.

---

## v0.41.0 — Sincronizar diz quantas músicas e escalas vieram/foram
**Recurso (nuvem).** Ao sincronizar, o app agora informa **a contagem** — tanto no **download**
("Atualizar do link" / auto-sync) quanto no **upload** ("Publicar na nuvem"). Antes o pull dizia
"Atualizado: N cifra(s)" e o publish só "Publicado na nuvem"; faltava clareza de quanto rolou.
- **Download (pull):** com novidade, `toast` **"Sincronizado: +2 músicas, +1 escala"** (ordem:
  músicas novas → músicas atualizadas → escalas novas → escalas atualizadas). Sem nada novo, o pull
  **manual** diz **"Já está tudo sincronizado"** (antes mostrava "Atualizado: 0 cifra(s)", confuso);
  o **auto-sync silencioso** continua **calado** quando não há novidade (só fala quando há).
- **Upload (publish):** no sucesso, `toast` **"Publicado: 12 músicas e 3 escalas"** (o total que foi
  pra nuvem — responde "quantas foram") + um **delta opcional** entre parênteses quando há entradas/
  saídas: **"(cifras +1 · escalas −1)"**.
- **Plural pt-BR** correto via helper `pl(n,sing,plur)` ("1 música" vs "3 músicas", "1 escala" vs
  "2 escalas").
- **Como:** as contagens já existiam — `mergeSongs` devolve `{added, updated}`, `diffRepo` conta
  cifras/escalas +/− por id. Faltava (a) contar **escalas atualizadas**: `mergeEscala` passa a
  devolver `"add"|"upd"|""` (em vez de booleano) e o `doImport` soma `escUpd`; e (b) surfaçar tudo
  nos toasts via `pl()` e o novo `pubLabel(d)`.
- **Assimetria honesta:** o **upload não reporta "atualizadas"** — o `diffRepo` compara presença de
  `id` (entrou/saiu), não conteúdo; então o publish fala "total enviado + novas/removidas", e só o
  download distingue "atualizadas". (Não é bug; é o que o diff sabe.)
- **221 verificações** (12 novas: download com novidade/singular/atualizadas/escala-atualizada/sem-
  novidade/silencioso-com-e-sem-novidade; upload 1ª-vez/singular/delta/remoção/só-atualização),
  zero erro de JS.

---

## v0.40.1 — "Intro" não vira mais o artista na importação
**Correção (importar colando).** Ao colar uma cifra, o cabeçalho do `parseImport` junta até
duas linhas (título e artista) e só parava ao encontrar uma linha de acordes, uma seção
(`isSectionLine`) ou um `[...]`. Como o `isSectionLine` só reconhece seção com **colchetes**
(`[Intro]`) ou **dois-pontos** (`Intro:`), um rótulo de seção **"pelado"** — sem nenhum dos dois,
como `Intro`, `Introd.` ou `Verso 1` — não interrompia o cabeçalho e era capturado como **artista**.
- **Causa-raiz:** confirmado que `Introd.:` (com dois-pontos) **já** funcionava; o que escapava era a
  forma sem dois-pontos/colchetes (`Intro`, `Introd.`, `Introdução`, `Verso 1`, `Solo`, `Refrão`…).
- **Correção cirúrgica:** nova lista curada `SECTION_WORDS_RE` (rótulos pt-BR comuns, com abreviação,
  acento e número opcionais) usada **só no cabeçalho do `parseImport`**, com guarda `leading.length>=1`
  — encerra o cabeçalho num rótulo pelado **a partir da 2ª linha** (assim a 2ª linha "Intro" não vira
  artista), mas **preserva** um título que por acaso seja uma palavra de seção (ex.: música chamada
  "Introdução").
- **`isSectionLine` fica intacta** (continua exigindo `[ ]` ou `:`): a exibição (`renderCifra`) e o
  corretor (`lintCifra`) não mudam, então uma palavra solta da **letra** nunca passa a ser destacada
  como seção no player. Parser de importação é generoso; render é conservador.
- **Regressão coberta:** 8 verificações novas (Intro solta, `Introd.`, `Introd.:`, `Verso 1`, título
  "Introdução" preservado, artista legítimo intacto, "Solo Deo" ainda é artista, `isSectionLine`
  inalterada). **209 verificações**, zero erro de JS.

---

## v0.40.0 — Ordenar a lista de cifras (alfabética · recência · menos tocadas)
**Recurso (biblioteca).** Um seletor de ordem na lista de cifras, usando a recência da v0.24.0
("última vez que tocamos", derivada das escalas confirmadas).
- Botão **`#sortBtn`** no cabeçalho da lista (ao lado da contagem) abre a folha **"Ordenar por"**
  com três modos (o atual marcado com ✓):
  - **Alfabética (A–Z)** — padrão.
  - **Tocadas recentemente** — as tocadas há menos tempo no topo; nunca tocadas por último.
  - **Menos tocadas (dar vez)** — nunca tocadas no topo, depois da mais antiga para a mais recente.
- A preferência **persiste** (`settings.sortMode`); o botão mostra o modo atual com ícone `arrow-up-down`.
- Reusa `buildLastPlayed()`; nada de dado novo. Degrada bem sem escalas confirmadas (recência vira A–Z).
- **201 verificações** (6 novas: os 3 modos, rótulo do botão, folha com 3 opções, persistência), zero erro de JS.

---

## v0.39.0 — Pull lê o commit atual (sem atraso do GitHub Pages)
**Recurso/correção (nuvem).** Resolve o "sincronizei e veio o arquivo velho". O pull lia o **link do
GitHub Pages**, que é servido por CDN **e** depende de um *rebuild* do site após cada commit — logo
após "Publicar", o Pages ainda entrega a versão anterior por um tempo, mesmo com fura-cache. (Não
era cache do navegador: o fetch do app já usa `cache:"no-store"` + `?t=` único.)
- **`getRepoText(url)`:** quando a URL é do GitHub, o pull lê o **conteúdo do commit atual** pela
  **API Contents** (`api.github.com`, reusa `ghRepoFromUrl`/`ghGetCurrent`) — reflete a publicação
  **na hora**, sem esperar o rebuild do Pages. Usa o token se houver (líder; evita o limite de 60/h).
- **Fallback preservado:** em rate-limit (403), erro, arquivo inexistente (404) ou host **não-GitHub**,
  cai para o `fetch` do link como antes — nunca fica pior que hoje.
- **Indicador de versão/idade:** "Publicar" carimba `publishedAt` no snapshot; ao puxar, o app guarda
  `repoCloudApp`/`repoCloudAt` e o status mostra **"nuvem vX · publicada há Y"** — confiança visual de
  que veio o atual.
- Vale para o pull manual **e** para o auto-sync (boot + voltar pro app).
- **195 verificações** (3 novas: lê pelo commit, guarda versão/idade, fallback não-GitHub), zero erro
  de JS. (Stubs dos testes M6/auto/voltar passaram a usar host não-GitHub, já que o caminho GitHub
  agora fala com a Contents API — coberto pelo teste próprio.)

---

## v0.38.0 — Auto-sync também ao voltar pro app
**Recurso (nuvem).** Estende o "Sincronizar ao abrir" (v0.37.0): além do boot, o pull silencioso
também roda **ao voltar para o app** (quando a aba/janela fica visível de novo), no
`visibilitychange` que já reacendia a tela no player.
- Pendurado no handler de `visibilitychange` existente: ao ficar visível, `maybeAutoPull({throttle:true})`.
- **Throttle de 1 min** (`AUTO_SYNC_COOLDOWN`/`lastAutoSync`): alternar de app rapidinho **não**
  fica martelando o GitHub — só busca de novo passado o intervalo. O boot continua sem throttle.
- Mesmo comportamento silencioso/idempotente/mão-única e a mesma prioridade do `#imp=`.
- **192 verificações** (2 novas: puxa ao voltar, throttle bloqueia reabertura imediata). Também
  estabilizei um teste flaky do auto-sync (baseline de sheet fechado — era estado global de outro
  teste, não do recurso), confirmado em 6 execuções limpas.

---

## v0.37.0 — Sincronizar ao abrir (auto-sync do repertório, habilitável)
**Recurso (nuvem).** Opção para **puxar o repertório da nuvem automaticamente ao abrir o app** —
assim a equipe pega as novidades (cifras **e escalas**) sem precisar lembrar de "Atualizar do link".
- **Toggle "Sincronizar ao abrir o app"** no cartão *Baixar* do Repertório na nuvem
  (`settings.autoPull`, **desligado por padrão**).
- No boot, se ligado e houver link salvo, roda um **pull silencioso** (`maybeAutoPull` →
  `pullRepo({silent:true})`): **sem skeleton**, **sem folha de conflito**, **sem erro barulhento**
  se estiver offline; toast discreto **só quando há novidade** ("Sincronizado: +2 cifras, +1 escala").
- **Não-interativo e idempotente:** usa a política "manter as minhas" (não duplica cifras de título
  repetido, remapeia a referência da escala) — abrir o app várias vezes não cria cópias.
- **Mão única** preservada (puxa, nunca escreve sozinho). Um link `#imp=` em importação tem
  prioridade (o auto-sync não atropela).
- **Por que também ajuda no "publiquei e a escala não apareceu":** o snapshot da nuvem **sempre**
  trouxe cifras + escalas (`fullEnvelope`/`louvai-full`); o que costuma falhar é **operacional** —
  esquecer de puxar, ou cancelar a folha de conflito de título no "Atualizar do link". O pull
  automático e não-interativo remove essas duas armadilhas.
- **190 verificações** (4 novas: traz escala, silencioso/sem duplicar, idempotente, toggle persiste),
  zero erro de JS.

---

## v0.36.1 — Limpeza pós-auditoria (coerência da fonte única de ícones)
**Correção (interface/coerência).** Auditoria das Ondas 1–3 (planejado × entregue) não achou gaps
funcionais; apontou só um resíduo cosmético: os dois `<span class="mag">` ainda traziam o emoji `🔍`
literal no HTML (sobrescrito por `paintIcons()` no boot). Para fechar 100% o princípio da **fonte
única de ícones** (Onda 2), os spans agora nascem vazios e são pintados só pelo `icon("search")` —
como todos os outros botões. Sem mudança visual (o SVG já era o que aparecia). 186 verificações.

---

## v0.36.0 — Skeleton de carregamento no "Atualizar do link" (Onda 3 · M6)
**Recurso (interface).** Sétimo e último item da Onda 3 (M6 de `ANALISE-ui.md`). **Percepção de
velocidade** onde existe espera de verdade: ao puxar o repertório de um link (rede).
- **Placeholders pulsantes** (`.skel`/`.skel-card`) na lista enquanto o `pullRepo` busca a rede;
  somem quando o repertório chega (e a lista é restaurada se a busca falha).
- **Decisão honesta sobre o "ao abrir o player":** a abertura do player é **síncrona** (sem espera),
  então um skeleton ali só piscaria 0 frames e arriscaria a **medição do Modo Página** — o aviso do
  próprio plano. Por isso o skeleton fica no caminho que realmente espera (o pull), não no player.
- **Respeita `prefers-reduced-motion`** (a pulsação some sob "reduzir movimento"; o placeholder
  estático permanece).
- **186 verificações** (2 novas: skeleton ao buscar, some ao chegar), zero erro de JS.
- **Fecha a Onda 3** do `PLANO-ui.md` (M2·M4·M5·M3·M7·M8·M6) → encerra o polimento de UI em ondas
  (1·2·3). Falta a validação visual no celular (palco, dark/light).

---

## v0.35.0 — Progresso do culto na Apresentação (Onda 3 · M8)
**Recurso (interface).** Sexto item da Onda 3 (M8 de `ANALISE-ui.md`). No modo Apresentar dava pra
saber a posição só lendo "2 de 5". Agora uma **barra fininha de progresso** no topo da `#presentbar`
mostra **onde estamos no culto** de relance, sem ler número.
- Faixa de 3px (`.pb-progress`) com preenchimento em acento; largura = (música atual / total).
- Enche conforme avança pelas músicas da escala; cheia na última.
- Atualizada no `updatePresentBar` (junto do "X de Y") — `aria-hidden` (o número já anuncia ao leitor).
- **184 verificações** (2 novas: cheio na última, ~50% na 1ª de 2), zero erro de JS.

---

## v0.34.0 — Entrada da lista com stagger (Onda 3 · M7)
**Recurso (interface).** Quinto item da Onda 3 (M7 de `ANALISE-ui.md`). Os cards apareciam "secos",
todos de uma vez. Agora a lista **entra com um stagger sutil** (opacidade + leve subida), dando a
sensação de "lista viva" que sinaliza app pronto.
- **Só na primeira pintura** de cada lista (cifras e escalas): re-render por busca/filtro **não**
  re-anima (evita o pisca-pisca a cada tecla). Controlado por um flag (`staggered`) + helper
  `staggerIn`.
- Escalonamento de ~28ms por card (limitado aos primeiros), `@keyframes cardIn` em ~260ms.
- **Respeita `prefers-reduced-motion`:** a duração some sob "reduzir movimento" (regra global).
- **182 verificações** (2 novas: anima na 1ª pintura, não re-anima no filtro), zero erro de JS.

---

## v0.33.0 — Arrastar para fechar sheets (Onda 3 · M3)
**Recurso (interface).** Quarto item da Onda 3 (M3 de `ANALISE-ui.md`). O `.grip` (a alcinha no topo
de cada sheet) sugeria que dava pra arrastar, mas o sheet só fechava pelo fundo escuro — uma
promessa de affordance não cumprida.
- **Gesto de arrastar para fechar** em todos os sheets (Ajustes, Compartilhar, Repertório, seletor,
  colar): segura no **grip** ou no **cabeçalho** e puxa pra baixo. Segue o dedo 1:1.
- **Limiar de ~90px:** passou disso, fecha; soltou antes, **volta com mola**.
- Pega só no grip/cabeçalho — **nunca** sequestra a rolagem do corpo do sheet nem os campos/botões.
- A volta/fechamento usam a transição do CSS, então **respeitam `prefers-reduced-motion`**
  (sob "reduzir movimento" o gesto continua funcionando, sem animação).
- **180 verificações** (2 novas: arraste longo fecha, arraste curto volta), zero erro de JS.

---

## v0.32.0 — Repertório na nuvem reorganizado (Onda 3 · M5)
**Recurso (interface).** Terceiro item da Onda 3 (M5 de `ANALISE-ui.md`). O `#reposheet` era o sheet
mais longo e denso do app: link, exportar, token e publicar empilhados num scroll só, sem hierarquia
— intimidante pra equipe que só quer **baixar**.
- **Dois cartões claros:** **"Baixar do link (equipe)"** (link + status + "Atualizar do link") e
  **"Publicar (líder)"**.
- **Publicar recolhido por padrão** (`<details>` nativo, acessível por teclado): a maioria da equipe
  só baixa e não vê o fluxo de token. Abre **sozinho** quando já existe um token salvo (líder).
- Dentro de Publicar: "Exportar tudo (arquivo .json)", o token e "Publicar na nuvem"/"Remover token".
- Sem mudança de lógica — IDs e handlers preservados; só estrutura/hierarquia visual.
- **178 verificações** (3 novas: cartões, recolhido sem token, aberto com token), zero erro de JS.

---

## v0.31.0 — Linguagem de card unificada (Onda 3 · M4)
**Recurso (interface).** Segundo item da Onda 3 (M4 de `ANALISE-ui.md`). A lista de cifras
(`.songcard`) e a de escalas (`.escard`) eram **telas irmãs com gramáticas visuais diferentes**:
a de escalas já usava pílulas de metadado; a de cifras empilhava tags e recência como texto solto
em níveis muito próximos (16,5/13,5/11,5/11,5px), deixando o card "denso e sem ritmo".
- **Mesma gramática nas duas telas:** **título → subtítulo → faixa de metadados em pílulas**
  (`.c-ttl` / `.c-sub` / `.c-meta` + `.pill`). Dois níveis de leitura, não quatro.
- **Cifra:** tags viram **pílulas** (`.pill.tag`) e "tocada há…/nunca tocada" vira uma pílula
  (`.pill.never` com acento, pra "dar vez" às nunca tocadas) — tudo numa faixa só.
- **Escala:** nº de músicas, duração e equipe usam a **mesma** `.pill` (some o `.estag` próprio).
- **Respiro 8pt:** padding/margens dos cards em múltiplos de 8 (`--sp-*`), raios e tipografia em
  tokens (`--fs-*`, `--r-sm`/`--r-pill`) — fim dos `11/13,5/15px` soltos. Interno ≤ externo.
- **175 verificações** (2 novas: songcard e escard na mesma gramática), zero erro de JS.

---

## v0.30.0 — ⚙ Ajustes em seções (Onda 3 · M2)
**Recurso (interface).** Primeiro item da Onda 3 do `PLANO-ui.md` (M2 de `ANALISE-ui.md`). O sheet
"Ajustes da cifra" era uma lista vertical de 8 linhas com o mesmo peso visual — afinação, leitura e
ações misturadas. Por que importa: no palco, na penumbra, achar o controle certo de relance fica
mais rápido quando eles estão agrupados.
- **Três seções com subtítulo:** **Afinação** (Tom · Capo · Tamanho da fonte), **Leitura** (Modo de
  leitura · Só letra · Tablaturas · Barra de auto-scroll) e **Esta música** (Editar · Enviar).
- Subtítulos discretos (`.sheetsec`, caixa-alta, acento suave, divisória fina no topo de cada grupo).
- **Editar/Enviar** viram uma **linha de ações** que ocupa a largura (`.ctrl.actions`), em vez do
  rótulo redundante "Música".
- **IDs e handlers preservados** (só reordenação + subtítulos) — nada de comportamento mudou.
- **173 verificações** (3 novas: 3 seções, IDs preservados, linha de ações), zero erro de JS.

---

## v0.29.0 — Ícones SVG inline unificados, Onda 2 (cara de app pronto)
**Recurso (interface).** Segunda onda do `PLANO-ui.md` (item M1 de `ANALISE-icones.md`): o
maior salto "protótipo → produto". Por que: o app misturava **emoji coloridos** (`🔗 ☁ 🗑 🎵 🔍`,
que mudam de desenho entre Android/iOS/Windows e fogem da paleta) com **glifos monocromáticos**
e uma **família de setas quase idênticas** (`↥ ↧ ↗ ↑ ↓`) usadas para coisas diferentes — a maior
fonte de ambiguidade no palco com pouca luz.
- **Fonte única de ícones:** objeto `ICONS` (paths Lucide, MIT) + helper `icon(name[,cls])` que
  devolve um `<svg class="ic-svg" stroke="currentColor">` — assim como `parseChord` é a fonte
  única dos acordes. `currentColor` faz o ícone **herdar o tema** nos dois modos, sem emoji fora
  de paleta. `paintIcons()` pinta os botões estáticos no boot.
- **Conjunto coeso (traço 2px):** voltar `arrow-left`, estrutura `list-music` (não confunde com
  "menu"), ajustes `sliders`, compartilhar `share-2` (some o `↗` de "abrir externo"), enviar
  arquivo `file-down`, link `link`, nuvem `cloud`/`cloud-upload`, editar `pencil`, apresentar/
  rolar `play`/`pause`, tema `sun`↔`moon`, excluir `trash-2`, buscar `search`, copiar `copy`,
  mover `chevron-up`/`down`, importar `download`/restaurar `upload`, abas `music`/`calendar-days`.
- **Ambíguos resolvidos:** `𝄞` (só-letra) → `type` (texto), `≣` (tabs) → linhas de tablatura;
  `↗` vs `🔗` nos sheets viram `file-down` (arquivo) vs `link` (link), distintos.
- **Exceções deliberadas (língua do músico, ficam texto):** `♯`/`♭` (tom), `A−`/`A＋` (fonte),
  `−`/`＋` (capo) e o `＋` de "Novo".
- **Acessibilidade:** `aria-hidden` no `<svg>`, `aria-label` no `<button>`; toggles seguem com
  `aria-pressed`; alvo de toque ≥48px preservado (o SVG menor não reduz a área).
- **Teste:** o smoke valida `icon()`/`ICONS`, botões só-ícone sem glifo de texto, botões
  ícone+rótulo (`.ic-tx`) com texto preservado, abas/lupa/itens de sheet em SVG e o ícone do
  estado vazio (`.eic`). **170 verificações**, zero erro de JS.

---

## v0.28.0 — Polimento de UI, Onda 1 (cara de app pronto)
**Recurso (interface).** Primeira onda do `PLANO-ui.md` (insumo: `ANALISE-ui.md`/`ANALISE-icones.md`).
- **Fundação de tokens:** escala tipográfica (`--fs-*`), grade 8pt (`--sp-*`) e raios
  (`--r-sm`/`--r-pill`) — aplicados nos componentes tocados (a cifra mono fica fora).
- **Tom em destaque (G4):** na linha do player, o "Tom: X" vira mono + acento (`.tomhi`) — a
  info mais olhada no palco para de se esconder no cinza.
- **Toast tipado e acessível (G6):** `toast(msg, tipo)` com faixa de cor (sucesso/erro/aviso),
  erro dura mais, `role="status"`/`aria-live`; principais toasts (nuvem/import/salvar) tipados,
  sem depender de emoji.
- **Estados vazios certos (G7/G8):** busca sem resultado tem mensagem própria + "Limpar busca";
  vazios de cifras/escalas têm ícone próprio e **botão de ação embutido**.
- **Acorde legível no claro (G9):** chip/halo violeta translúcido no `.light` — não some com sol
  no palco de manhã.
- **Ícone de Backup (1ª onda de ícones):** `↥` → **`archive` (SVG)** e a entrada renomeada para
  **"Repertório"**; `↧` → `download` (SVG). Some a confusão do par de setas. (Migração total pra
  SVG é a Onda 2.)
- **163 verificações**, zero erro de JS.

---

## v0.27.3 — Correção: folha de publicar empilhava e o "publicado" não aparecia
**Bugfix (nuvem/UI).** Ao tocar "Publicar na nuvem", a confirmação (e os detalhes) abriam
**atrás** da folha "Repertório na nuvem" — porque a folha **não era fechada** antes. Como o
`#reposheet` vem depois do `#sheet` no HTML (mesmo `z-index`), ele **pintava por cima** da
confirmação; e a folha aberta deixava o **toast "Publicado ✓"** passar despercebido.
- **Correção:** `publishRepo` agora **fecha a folha da nuvem** (`closeRepoSheet`) **antes** de
  abrir a confirmação — sem empilhamento. O toast de sucesso ficou explícito: **"Publicado na
  nuvem ✓ (+N −M cifras)"**, agora visível.
- **Regressão:** teste cobre o fluxo real (abrir a folha → tocar Publicar) e verifica que a folha
  **fecha** ao abrir a confirmação e que o **toast de envio** aparece após confirmar.
  **157 verificações**, zero erro de JS.

---

## v0.27.2 — "Ver detalhes" no diff de publicação (nomes que entram/saem)
**Recurso (nuvem).** A confirmação de publicar (v0.27.1) mostrava só **contagens**. Agora tem
**"Ver detalhes (nomes)"**: uma folha rolável listando os **títulos** das cifras/escalas que vão
**entrar (+)** e **sair (−, em vermelho)** — dá pra conferir item a item antes de gravar (e
publicar dali mesmo). Reforça a rede de segurança: você vê exatamente *quais* músicas sairiam da
nuvem se publicasse de um aparelho desatualizado.
- **Por dentro:** `diffRepo` agora devolve os **nomes** (`sAddN`/`sRemN`/`eAddN`/`eRemN`, não só
  contagens); `showPublishDetails` monta a folha (cap de 60 por lista; removidas com `.danger`).
- **Testes:** confirmação oferece "Ver detalhes"; a folha lista o nome que entra e o que sai.
  **155 verificações**, zero erro de JS.

---

## v0.27.1 — Diff ao publicar (quantas cifras +/− e confirmação)
**Recurso/segurança (nuvem).** Publicar agora **mostra o que vai mudar** antes de escrever — e
isso é também uma **rede de segurança**.
- **Antes de escrever:** o app busca o arquivo atual da nuvem (o mesmo GET que pega o `sha` traz
  o **conteúdo**) e **compara por `id`** com o que vai enviar. Abre uma **confirmação** com o diff:
  *"Publicar na nuvem? **(+3 −1 cifras)**"* + nota *"Cifras: +3 / −1 · Escalas: +1 / −0"*.
- **Proteção real:** se você publicar de um aparelho **desatualizado** (esqueceu de "Atualizar do
  link"), o diff mostra **"−40 cifras"** e o aviso **"vai REMOVER itens da nuvem — você atualizou
  antes?"** → dá pra **cancelar** antes de sobrescrever o repertório da nuvem com menos do que ele
  tinha. "Nada salvo no escuro" aplicado à publicação.
- **1ª publicação:** "Publicar pela 1ª vez? (N cifras, M escalas)". Sucesso → toast
  *"Publicado ✓ (+3 −1 cifras)"*.
- **Por dentro:** `ghGetCurrent` (lê `{sha, data}` decodificando o base64 do GitHub), `diffRepo`
  (conta +/− de cifras e escalas por `id`), `diffLabel`/`diffNote`, e `doPublish` (PUT + retry no
  409) separado da confirmação. Erros de token/rede seguem tratados.
- **Testes:** confirmação aparece **antes** de escrever; diff +1/−1 e o aviso de remoção; nada é
  publicado sem confirmar; confirmar dispara o PUT com `Authorization` + snapshot. **153 verificações**.

---

## v0.27.0 — Publicar na nuvem (editar no celular → escrever no louvai.json)
**Recurso (compartilhar, sem backend nosso).** Fecha o ciclo da nuvem: a v0.26.0 **puxava**;
agora o líder **publica** o `louvai.json` **direto do aparelho**, via **API do GitHub** (que
aceita escrita do navegador). O fluxo do líder vira **editar → Publicar**; a equipe segue puxando.
- **Token fino, só no aparelho:** o líder cria um *fine-grained token* (escopo: o repo do app,
  **Contents: escrever**) e cola no app. Fica no `localStorage` **do aparelho**, **nunca no
  código** (que é público) — só conversa **direto com o GitHub** (HTTPS) ao publicar. Há
  **"Remover token deste aparelho"**; e dá pra **revogar** no GitHub a qualquer momento.
- **Publicar:** `publishRepo()` deriva `owner/repo/path` da própria URL de pull (`ghRepoFromUrl`),
  pega o `sha` atual (GET) e escreve (PUT) o snapshot `louvai-full` em **base64 padrão**
  (`bytesToB64`). A **1ª publicação cria** o arquivo (404 → cria), sem upload manual.
- **Conflito tratado:** se o `sha` estiver velho (mudou na nuvem), rebusca e tenta de novo;
  persistindo → "Mudou na nuvem — atualize e tente de novo". Sem internet / token inválido /
  URL não-GitHub → toasts honestos, sem quebrar.
- **Folha "Repertório na nuvem"** ganhou o bloco **Publicar (líder)**: campo do token (oculto),
  "Publicar na nuvem", "Remover token", e a linha de status mostra *baixou…/publicou…*.
- **Limites (MVP):** *last-write-wins* (com retry no 409); sem OAuth (é o PAT, simples pro caso
  de **um** líder); a equipe **não** publica (só pull). Ver `PLANO-publicar-nuvem.md`.
- **Segurança:** token **fino + single-repo + Contents only + com validade + revogável** — pior
  caso se vazar: escrever naquele único repo (reversível). O app já escapa saída (`esc()`, v0.13.2).
- **Testes (sem rede real):** `ghRepoFromUrl`, `bytesToB64`, e `publishRepo` com `fetch`
  **stubado** (confere GET sha → PUT com `Authorization` + `content` base64), além de sem-token /
  URL não-GitHub / remover token. **149 verificações**, zero erro de JS.

---

## v0.26.0 — Repertório + escalas por link (pull do GitHub Pages)
**Recurso (importar/compartilhar, sem backend).** Um **retrato completo** do ministério —
cifras **e** escalas — publicado num arquivo só, que a equipe **puxa** por um link. Celular
novo pega tudo de uma vez; a equipe atualiza de tempos em tempos. **Mão única:** o líder
**publica**, a equipe **baixa** (escrever de volta exige login → fase online).
- **Snapshot único `louvai.json`:** novo **"Exportar tudo (pra publicar)"** gera o envelope
  `louvai-full` = `{songs, escalas}` (cifras uma vez; escalas referenciam por `id` → arquivo
  compacto). O líder sobe esse arquivo no GitHub Pages (ao lado do `index.html`); o git
  **versiona** o repertório de graça.
- **"Atualizar do link":** nova folha **"Repertório na nuvem"** (no Backup) com o campo da URL,
  "Atualizar agora" e "Exportar tudo". `pullRepo()` faz `fetch` com **fura-cache** (CDN não
  serve versão velha) e joga no `importJSON` — que agora entende `louvai-full` e **mescla cifras
  E escalas** (dedup por `id`/`updatedAt`, com o aviso de título duplicado da v0.22.0).
- **Sinergia:** como o `done` ("Culto realizado") e a equipe (`team`) viajam no snapshot, a
  recência **"última vez que tocamos"** (v0.24.0) fica igual pra equipe quando o líder publica.
- **GitHub, não Drive:** o GitHub Pages serve com CORS liberado (o navegador lê); o Drive
  bloqueia por CORS na leitura e exige OAuth pra escrever — por isso não serve pro pull.
- **Complementar ao link de WhatsApp (v0.21.0):** aquele empurra *a escala de hoje agora*;
  este puxa *o retrato completo* (novo aparelho / refresh).
- **Erros honestos:** sem internet → "Não consegui buscar — sem internet?"; conteúdo que não é
  repertório → "O link não tem um repertório válido". Nada quebra.
- **Limites (MVP):** mão única (pull); publicar é manual; **apagar não propaga** (mescla só
  adiciona/atualiza); arquivo público **com os nomes da equipe** (escolha do dono); funciona
  melhor se a equipe **partir do snapshot do líder** (ids alinhados). Ver `PLANO-repertorio-link.md`.
- **Por dentro:** `fullEnvelope`/`exportFull`, `pullRepo` (+`settings.repoUrl`/`repoPulledAt`),
  `openRepoSheet`, `mergeEscala` (extraído) e o ramo `louvai-full` no `importJSON`/`doImport`.
  **138 verificações**, zero erro de JS.

---

## v0.25.0 — Diagramas de acorde (pegada ao tocar no acorde)
**Recurso (qualidade da cifra).** Tocar num acorde no player abre um **popover com a pegada**
no violão — fecha o Tema C. Aliado ao princípio "uma pegada errada é pior que nenhuma".
- **Híbrido (decisão do dono):** formas abertas **curadas e verificadas à mão** (C, A, G, E, D,
  Am, Em, Dm, os 7/m7/7M/sus comuns e slashes como C/E, D/F#, G/B) + um **motor de templates
  móveis** (pestanas E-shape/A-shape) que cobre maj/m/7/m7/maj7/sus4/sus2 nos 12 tons. O que o
  motor não voiceia com segurança → **"sem diagrama"** honesto.
- **Reusa a fonte da verdade:** `parseChord` (raiz/qualidade/baixo) e `NOTE_IDX`. No player o
  texto do acorde já é a **forma com capô** (`ctxShape`), então o diagrama mostra a pegada que
  a pessoa **realmente faz** — sem recalcular capô.
- **`7M` = sétima maior (pt-BR):** o `chordIntervals` trata `7M`/`M7`/`maj7` como sétima maior
  e `7` sozinho como dominante.
- **Render SVG** tema-aware (claro/escuro): grade 6×5, bolinhas, `x`/`o`, **pestana** e número
  da casa-base. **Toque no acorde** abre o popover (na rolagem e na página, sem virar página);
  tocar fora fecha.
- **Validação por NOTAS (o teste forte):** o teste **calcula as notas que cada forma gera** e
  confere que são só notas do acorde e contêm a raiz — para as 12 raízes × qualidades **e para
  todas as formas curadas**. Pegada com nota errada **não passa no CI**.
- **Limites honestos (MVP):** uma posição por acorde; `dim`/`aug`/`m7b5`/`6` só quando há forma
  curada (senão "sem diagrama"); slash exótico mostra a forma base; só violão padrão. Outras
  posições, cavaco/ukulele e afinações ficam pra incrementos futuros (ver `PLANO-diagramas-acorde.md`).
- **Por dentro:** `OPEN`, `chordIntervals`, `qualityFamily`, `TPL_E`/`TPL_A`, `placeTemplate`,
  `fingering`, `chordSvg`, `showChordDiagram`. **132 verificações**, zero erro de JS.

---

## v0.24.0 — "Última vez que tocamos" (derivado das escalas confirmadas)
**Recurso (repertório / uso ao vivo).** Mostra, em cada cifra, **quando foi tocada pela
última vez** — pra não repetir a mesma música todo domingo e dar vez às esquecidas.
- **A sutileza que faz a diferença (apontada pelo dono):** a **escala é um plano, não um
  registro**. O ministro monta pro ensaio; se uma música não engata, troca por outra. Contar
  "tocou" só porque estava na escala **inflaria** a recência. Então só conta como tocada a
  música que está numa escala marcada **"Culto realizado"** — porque os ajustes acontecem no
  ensaio e o que permanece na escala é o que vai ao culto.
- **Confirmar:** botão **"Marcar culto como realizado"** no detalhe da escala (vira
  "✓ Culto realizado"); guarda `e.done`. Só escalas confirmadas com data entram na conta.
- **Onde aparece:** na **lista de cifras** e no **seletor ao montar a escala** (onde "evitar
  repetir" mais ajuda): "tocada hoje / há 3 dias / há 2 semanas / há 4 meses…" ou
  **"nunca tocada"** (com leve destaque). "Nunca tocada" só aparece quando **já existe alguma
  escala confirmada** — sem isso, não polui.
- **100% derivado, sem migração:** a fonte é escala + data + `done`. `e.done` viaja no
  exportar/importar (escala antiga sem o campo = não confirmada, não conta até você marcar).
- **Fora de escopo (próximo):** **ordenar** por menos tocadas (Tema D) — aqui é só mostrar.
- **Por dentro:** `buildLastPlayed()` (mapa songId→data, só `done`), `fmtPlayed`, `playedLine`,
  `todayISO`; botão `#es-done`.
- **Testes:** escala não confirmada não conta; confirmar faz contar (data da escala); música
  fora não conta; card mostra "tocada há…"/"nunca tocada"; botão alterna o estado. **123
  verificações**, zero erro de JS.

---

## v0.23.0 — Backup com rede de segurança
**Recurso (segurança dos dados).** O Louvai guarda tudo **só no aparelho** — se você troca,
perde ou limpa o celular sem ter exportado, o repertório vai junto. O backup já existia, mas
era passivo: o app não lembrava de fazer nem mostrava quando foi a última vez. Agora há uma
rede de segurança em volta do backup **local** (sem nuvem — isso é fase online, com backend).
- **Data do último backup:** "Exportar TODO o repertório (.json)" passa a **registrar** a data
  (`settings.lastBackup`). Só o **arquivo** conta como backup — um link copiado não é backup salvo.
- **"Há mudanças desde então":** criar/editar/excluir cifra ou escala marca um flag
  (`dirtySinceBackup`, engatado no `saveSongs`/`saveEscalas`), limpo ao exportar.
- **Lembrete ativo (escolha do dono):** um **pontinho** no botão **↥** quando o backup está
  devido — **nunca feito** (com conteúdo real) **ou** há mudanças e já faz **≥ 7 dias** — e um
  **toast leve ao abrir o app** nesse caso. Não atropela uma importação por link (mesmo toast).
  Repertório mínimo (só a cifra de exemplo) **não** cutuca.
- **Restaurar claro:** o "Importar arquivo" do Backup virou **"Restaurar de um arquivo (.json)"**,
  e o sheet ganhou uma **linha de status** no topo ("Último backup: há 3 dias · há mudanças
  desde então"). Restaurar reusa o `importJSON` — já protegido pelo **aviso de título duplicado**
  (v0.22.0). Sem "apagar tudo e substituir" destrutivo.
- **Por dentro:** `backupDue`/`hasRealContent`/`markDirty`/`recordBackup`/`fmtAgo`/`backupNote`;
  `openSheet` aceita uma **nota** opcional; pontinho via classe `.due` no `#backupBtn`.
- **Testes:** devido sem backup (pontinho on); exportar grava data e limpa o flag; lembrete some
  após backup; editar remarca; repertório mínimo não cutuca; rótulo "Restaurar" + linha de status
  no sheet; abrir com backup atrasado mostra o toast. **116 verificações**, zero erro de JS.

---

## v0.22.0 — Aviso de cifra com título repetido antes de importar
**Recurso (importação).** A deduplicação na importação sempre foi por **`id`**: reimportar
a mesma cifra/escala atualiza no lugar, sem empilhar. Mas quando **a mesma música nasce em
aparelhos diferentes** (ids distintos — um integrante digitou no celular dele, você no seu),
importar a escala dele criava uma **segunda cópia** com o mesmo título, em silêncio.
- **A mudança:** ao importar (arquivo **ou** link), se alguma cifra que chega tem **título
  igual ao de uma já existente, mas `id` diferente**, o app **avisa antes de mesclar** —
  "Você já tem: …" — com três opções:
  - **Manter as minhas (não duplicar):** descarta a versão que chegou e, **numa escala,
    remapeia a referência** pra sua cifra (a escala continua íntegra, apontando pra música
    que você já tinha — sem deixar item "órfão").
  - **Importar como cópias (ficar com as duas):** comportamento anterior, pra quando você
    quer comparar arranjos.
  - **Cancelar importação.**
- **Sem conflito = sem atrito:** título inédito (ou mesmo `id`, que é a mesma música) importa
  **direto**, como sempre. O aviso só aparece quando há de fato risco de duplicar.
- **Como funciona:** `collidingTitles()` detecta o choque (título normalizado, `id` diferente)
  **antes de tocar nos dados**; `mergeSongs(arr, policy)` agora aceita `"mine"`/`"both"` e
  devolve um **remap** de ids; `doImport()` aplica a política e remapeia `escala.items`.
- **Testes:** aviso aparece e nada é salvo antes da escolha; "cópias" gera duas cifras e a
  escala aponta pra importada; "minhas" não duplica e remapeia a escala pra cifra local;
  título inédito entra direto. **108 verificações**, zero erro de JS.

---

## v0.21.1 — Aviso de link longo (apps de mensagem cortam a URL)
**Correção (descoberta em campo).** Logo após a v0.21.0, o dono gerou um link do
**repertório inteiro** (~10 KB) e mandou no WhatsApp: no celular deu **"Link inválido"**.
- **A causa real:** o app **decodifica** o link sem problema (o mesmo link abria no PC) —
  o **WhatsApp cortou a URL longa** no caminho. O celular recebeu meio payload de gzip
  e não teve como abrir. Dois agravantes no código: **(1)** o aviso de tamanho só existia
  acima de **~30 KB** (alto demais — os ~10 KB passaram sem aviso); e **(2)** o aviso só
  aparecia no caminho do *copiar pro clipboard* — no celular, o **Web Share nativo**
  (`navigator.share`) era usado e **pulava o aviso**, então o dono nunca foi alertado.
- **A correção:** o aviso agora acontece **antes de compartilhar** (vale pro Web Share e
  pro clipboard) e com um limite realista (`LINK_MAX = 4000` chars). Link longo abre uma
  **folha** com **"Enviar como arquivo (recomendado)"** — que não sofre o corte —, "Enviar
  link mesmo assim" e "Cancelar". Uma cifra ou escala pequena segue indo **direto**, sem
  atrito. O envio em si virou `sendLink`; as 3 folhas passam o `fileFn` pro plano B.
- **Por quê arquivo:** o `.json` vai como anexo/documento e **não tem o limite de tamanho
  da URL** — é o caminho certo pro repertório e pra escalas grandes (o link brilha na
  **escala do culto**, curtinha, no grupo do WhatsApp).
- **Testes de regressão:** link longo dispara a folha de aviso (e "arquivo" é a 1ª opção e
  realmente chama o envio por arquivo); link curto **não** dispara o aviso e vai direto.
  **100 verificações**, zero erro de JS.

---

## v0.21.0 — Compartilhar por link auto-importável (sem servidor)
**Recurso (importar/compartilhar).** Receber uma escala ou cifra era trabalhoso:
baixar o `.json` e caçar o "importar". Agora dá pra mandar um **link** que a outra
pessoa só **toca** — e o app abre já oferecendo importar.
- **Como funciona:** o mesmo envelope JSON de hoje (`louvai-song` / `louvai-escala`
  / `louvai-library`) vai **comprimido (gzip) e em base64url no fragmento `#`** da
  URL — `…/#imp=…`. O `#` **nunca vai ao servidor**, cabe payload grande e
  **decodifica 100% no aparelho** (offline ao receber). Sem backend, sem upload:
  o link é montado no celular e enviado direto (WhatsApp). Fallback sem compressão
  quando o navegador não tiver `CompressionStream`.
- **Enviar:** nova ação **"Enviar link"** nas três folhas — cifra (`shareSheet`),
  **escala + cifras** (`shareEscalaSheet`, o caso principal) e repertório (Backup).
  Usa o Web Share nativo `{url}` e cai no **copiar pra área de transferência** se
  não houver (mesmo espírito à prova de falha do `shareFile`). O repertório inteiro
  costuma ser grande: avisa quando o link passa de ~30 KB (o **arquivo** segue como
  caminho primário do repertório).
- **Receber (nada salvo no escuro):** ao abrir um link `#imp=` (no boot **ou** com o
  app já aberto, via `hashchange`), o app decodifica e mostra uma **confirmação**
  ("Importar Escala 'X' (N cifras)" / "Cifra 'Y'" / "Repertório (N)") **antes** de
  mesclar — dado vindo de link é não-confiável. Confirmar reusa todo o `importJSON`
  (dedup por `id`, resolução por `updatedAt`, compatível com `levita-*`). O hash é
  **limpo na hora** (um refresh não reimporta) e link corrompido só mostra
  "Link inválido 😕", sem quebrar o boot.
- **Hosting-ready:** o código já roda em qualquer URL (boot lê o hash; o link usa a
  base da `location`). Próximo passo do dono é **hospedar** (GitHub Pages — passo a
  passo no `README` e no `PLANO-compartilhar-link.md`). **Honesto:** sem service
  worker, o 1º acesso pede internet; PWA offline/instalável fica para depois.
- **Testes:** round-trip dos helpers (gzip e fallback), geração do link, fluxo de
  **receber + confirmar** (escala + cifra entram, hash limpo), **cancelar** (nada
  entra) e **link inválido** (toast, sem exceção). **96 verificações**, zero erro de JS.

---

---

---

---

---

---

---

---

## v0.20.1 — Apresentação mostra o tom no topo (consistência com a visualização)
**Ajuste (uso ao vivo).**
- **O incômodo:** no player normal, a linha fininha (artista · Tom atual · capo)
  mostra o tom logo abaixo da barra; na Apresentação essa linha estava **escondida**,
  então o tom só aparecia abrindo o ⚙ Ajustes.
- **A mudança:** a Apresentação agora **mostra a mesma linha fininha** do tom no topo,
  igual à visualização normal — só deixei a `.songhead` (que o `drawPlayer` já
  preenche) visível no modo `.present`. A barra grande (`.controls`) segue oculta.
- **Guarda de regressão:** teste atualizado — em Apresentação, a `.songhead` fica
  visível e o `#p-sub` traz "Tom: A" (tom da escala).
- Validado: **87 verificações**, zero erro de JS.

---

## v0.20.0 — Player normal em barra de uma linha (cifra em primeiro lugar)
**Recurso (interface / leitura).** Leva a compactação da Apresentação para o
player comum (visualizar uma cifra).
- **A ideia:** o player de cifra avulsa empilhava duas linhas de controle
  (← ☰ ✎ ↗ / Tom ⚙) + um título grande de 24px — muito cromo pra quem só quer ler.
  Agora é **uma linha só**: `← · Título · ☰ · ⚙`, priorizando a cifra.
- **O que mudou:**
  - **Título** vira uma linha pequena na própria barra (era um bloco grande).
  - **Editar (✎), Compartilhar (↗) e o Tom** saíram da barra e foram pro **⚙ Ajustes**
    (o Tom já morava lá desde a v0.18.1).
  - **Estrutura (☰)** continua na barra (ajuda a navegar a música).
  - Abaixo da barra, uma **linha fininha** mantém *artista · Tom atual · capo* à vista
    (vê o tom de relance sem abrir o ⚙).
- **Reuso:** sem duplicar lógica — Editar/Compartilhar mantêm os IDs `#p-edit`/`#p-share`
  (só mudaram de lugar) e o Tom usa o `transposeBy` já existente.
- **Guarda de regressão:** testes atualizados — título na barra; Tom/auto-scroll fora
  dela; transpor e Editar/Compartilhar pelo ⚙ Ajustes; tom visível na linha fininha.
- Validado: **86 verificações**, zero erro de JS.

---

## v0.19.0 — "Livro": virar a página troca de música na Apresentação
**Recurso (uso ao vivo).**
- **A ideia:** no modo Apresentar + Página, ao chegar na **última página** da música
  e virar pra frente, o app já **passa pra próxima música** (na 1ª página) — sem
  precisar tocar no botão de música. Virar pra trás na **1ª página** volta pra música
  anterior e **retoma a última página dela** (comportamento de livro contínuo).
- **Mantido:** as setas ‹ › de música continuam funcionando como antes (vão pro
  começo da música anterior/seguinte). O "livro" é só o virar-página nos extremos.
- **Como:** `goPage` (o virar-página por toque) detecta o limite e, em
  `escalaCtx` + modo Página, chama `presentGo(±1)`; voltar passa `atLast` para o
  `openPlayer` abrir a música anterior na última página. Fora da Apresentação ou do
  modo Página, nada muda (vira a página clampado, como sempre).
- **Guarda de regressão:** novo teste — música longa (várias páginas) numa escala:
  virar além da última avança de música (1ª pág); voltar da 1ª retoma a última pág
  da anterior.
- Validado: **84 verificações**, zero erro de JS.

---

## v0.18.1 — Apresentação: Tom vai pro ⚙ Ajustes (barra de uma linha só)
**Correção/ajuste (uso ao vivo).** Refina a v0.18.0.
- **O incômodo:** na v0.18.0 a barra compacta tinha **duas fileiras** — a 2ª só
  pro Tom. Misturar a mudança de tom com o título e as setas ocupava espaço à toa:
  transpor ao vivo é eventual, não precisa estar à vista o tempo todo.
- **A mudança:** a fileira do Tom **saiu da barra**. A barra compacta agora é **uma
  linha só** (← ‹ título·2/5 › ⚙) e o controle de **Tom passou pro ⚙ Ajustes** (que
  o próprio ⚙ da barra já abre). Mais cifra na tela: o topo cai de ~100px para ~66px.
- **Bônus:** o Tom no ⚙ Ajustes vale também pro player normal (um segundo caminho,
  ao lado do Tom da barra de cima). Reusa `transposeBy` — sem duplicar lógica.
- **Guarda de regressão:** testes atualizados — o Tom **não** está mais na barra
  (`#pv-tkey` removido); o ⚙ abre o Ajustes; o Tom (A) aparece e transpõe lá dentro;
  a cifra começa ainda mais alto (`#p-body` acima de 140px).
- Validado: **81 verificações**, zero erro de JS.

---

## v0.18.0 — Barra compacta no Modo Apresentação (mais cifra no palco)
**Recurso (uso ao vivo).**
- **O incômodo:** no modo Apresentar de uma escala, o topo empilhava **três blocos**
  (controles + barra de navegação + título grande) — ~245px de cromo, ~30% de um
  celular comidos justo na hora de tocar ao vivo, sobrando pouca cifra.
- **A mudança:** só na Apresentação, os blocos grandes (`.controls` e `.songhead`)
  somem e a navegação vira uma **barra compacta de duas fileiras finas** (~100px):
  - **Fileira 1:** ← voltar · ‹ anterior · **título + posição (2/5)** · próxima › · ⚙ Ajustes.
  - **Fileira 2:** ♭ · **Tom** · ♯ (transpõe ao vivo).
  - As **setas de navegação** continuam em destaque (a prioridade do dono).
- **Como:** classe `.present` em `#view-player` (ligada quando há `escalaCtx`); o
  `#presentbar` virou a barra compacta. Os botões novos **reusam as mesmas funções**
  dos controles normais (`transposeBy`, `exitPlayer`, `openPlayerSheet`) — sem
  duplicar lógica nem mover nós no DOM. O **player de cifra avulsa não muda**.
  A paginação (Modo Página) se ajusta sozinha: mede a posição real do `#p-body`.
- **Fora do compacto (de propósito):** estrutura (☰), editar (✎) e compartilhar (↗)
  não entram na barra ao vivo — ficam no player normal.
- **Guarda de regressão:** novos testes — `.present` liga; `.controls`/`.songhead`
  escondidos; título/posição/tom na barra; transpor e navegar (‹ ›) pela barra;
  cifra começa no topo (`#p-body` acima de 180px); ← volta pra escala e desliga o
  `.present`.
- Validado: **79 verificações**, zero erro de JS.

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
