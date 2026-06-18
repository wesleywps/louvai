# PLANO — Validação de tom pelos acordes

> **Status: IMPLEMENTADO na v0.42.0** (238 verificações). Recurso **opcional**, off por
> padrão (`settings.checkKey`). Este documento guarda a **teoria musical** e as **decisões
> de calibragem** — os pesos são heurísticos e ajustáveis, então o "porquê" importa.

## Objetivo
Conferir se o tom informado (`song.key`, ex.: "G", "Am") **bate com os acordes** escritos na
cifra e, quando não bate, avisar de forma discreta **qual o informado e qual o provável** —
sem nunca alterar nada sozinho ("nada salvo no escuro"). Ajuda no domingo: cifra do Cifra Club
às vezes vem com `Tom:` errado, e o tom errado estraga transposição, grafia (♯/♭) e capo.

## Teoria musical (fundamento)
- **Maior — graus diatônicos:** I maj · ii min · iii min · IV maj · V maj (V7 dom) · vi min ·
  vii° dim. Semitons da tônica: `{0:maj, 2:min, 4:min, 5:maj, 7:maj, 9:min, 11:dim}` (`DIA_MAJ`).
- **Menor — natural ∪ harmônica:** a menor natural (eólio) tem i ii° III iv v VI VII; a
  **harmônica** sobe a sensível → o **V vira maior/V7** (cadência forte V→i) e surge o **vii°**.
  Por isso o conjunto diatônico do menor precisa ser a **união** das duas, senão músicas menores
  comuníssimas (com V7→i) seriam classificadas "fora do tom":
  `DIA_MIN = {0:min, 2:dim, 3:maj, 5:min, 7:maj, 8:maj, 10:maj, 11:dim}` — e o **grau 7 aceita
  maj (V harmônico) OU min (v natural)**, com bônus se for dominante (V7).
- **A qualidade tem que casar com a função:** "Em" é vi de G maior; "E" maior **não** é (vi é
  menor). É isso que separa um tom da sua relativa e dos tons de fora.
- **Relativa maior/menor (mesmas notas):** C maior e Am compartilham o conjunto diatônico →
  empatam na contagem crua. O **desempate é a tônica/cadência**: o **último acorde** é quase
  sempre a tônica (Wikipedia *Relative key*; AP Music Theory). Daí o bônus de cadência.
- **Emprestados/secundários:** acordes de fora do diatônico "duram pouco e não mudam o centro
  tonal". Levam uma **pequena penalidade** (`KW_OFF`, ver "armadilha v0.42.1" abaixo) — leve o
  bastante para que um `Bb` no tom de C ou um `A7` (V/ii) **não** joguem a detecção pra outro tom
  (a tônica/cadência do tom certo compensa; e progressão muito cromática vira `lowconf`).
- **Krumhansl-Schmuckler** é a referência conceitual (correlacionar distribuição observada ×
  perfil-modelo por tom), mas trabalha com **notas/duração** e ignora **ordem temporal**. Numa
  cifra só temos a **sequência de acordes**; por isso usamos **contagem diatônica ponderada por
  função + bônus de cadência** (mais barata, explicável, offline) em vez de K-S puro.

## Algoritmo implementado (em `louvai.html`, bloco Música/teoria após `transposeChord`)
- `songChords(body)` — coleta os acordes **na ordem** do corpo, reusando a varredura do
  `renderCifra` (linha de acordes, `[Sec] C G` na mesma linha, `[C]` inline na letra; ignora
  seção/letra/tab). Extrai só via `parseChord` (regra nº3).
- `triadOf(suffix)` / `isDomChord(suffix)` — reduzem o sufixo à tríade `{maj,min,dim,aug,sus}`
  e detectam dominante (maior + 7ª menor) **reusando `chordIntervals`** (trata sus/add/7M etc.).
  `sus` é **coringa**: casa qualquer função (sus2/sus4 não definem a terça).
- `detectKey(chords)` — pontua as **24 candidatas** (12 maj + 12 min). Para cada acorde, soma o
  peso da função se a qualidade casa com o grau diatônico; +bônus de cadência no 1º/último.
  Retorna `{key, pc, minor, score, confidence, lowData, ranking}`. **Confiança** = margem do 1º
  sobre o 2º colocado, normalizada (`(top-2º)/top`); progressão ambígua → confiança baixa.
- `compareKey(informed, det)` → `ok | relative | mismatch | lowconf`. **Relativa** (uma maior,
  outra menor, tônicas a 3 semitons) e **baixa confiança** (`lowData` < 3 acordes, ou
  `confidence < 0.15`) **nunca alarmam**.

### Pesos calibrados (ajustáveis — os testes travam o COMPORTAMENTO, não os números)
```
KW_TONIC = 2    // acorde de tônica (grau 0)
KW_DOM   = 2    // dominante (grau 7) — +0.5 se for V7 de fato
KW_DIA   = 1    // demais graus diatônicos (inclui IV — sem peso extra)
KW_OFF   = -2   // acorde FORA do diatônico (penalidade leve) — v0.42.1
KB_FIRST = 2    // 1º acorde == tônica
KB_LAST  = 4    // último acorde == tônica
```
> **Armadilha 1 (calibragem inicial):** os pesos de exemplo do desenho original
> (tônica 3 / dom 2.5 / subdom 1.5 / bônus 1·2) **não** decidiam a relativa pela cadência — o
> peso extra de subdominante (IV) enviesa pro **maior**. **Correção:** tirar o peso especial do IV
> (vira `KW_DIA`) e dar peso ao **último acorde** (`KB_LAST=4`) como desempate de relativas.
>
> **Armadilha 2 (validação adversarial, v0.42.1) — FALSO ALARME:** com `KB_LAST=4` e acorde de fora
> valendo **0**, uma cifra que termina no **IV** ou no **V** (a folha de louvor mais comum,
> I–V–vi–IV escrita uma vez: `C G Am F`) elegia o **IV** como tônica — o último acorde (F) ganhava
> 4 pontos como "tônica de F maior" e vencia o tom verdadeiro C, gerando `mismatch` num tom **certo**
> (~13% das cifras testadas). O `PLANO` só tinha verificado casos que **terminam na tônica**
> (`C F G Am`→Am), nunca o simétrico. **Correção:** penalizar levemente acorde fora do diatônico
> (`KW_OFF=-2`) — assim a tonalidade que encaixa **todos** os acordes vence a que "erra" um (no
> `C G Am F`, F-maior tem o **G** como não-diatônico) — e equiparar `KB_FIRST=2` (o 1º acorde é
> pista de tônica tão confiável quanto o último e **não** sofre com a folha listar só um ciclo).
> Verificado contra as 6 progressões I–V–vi–IV / vi–IV–I–V mais comuns (todas viram `ok`/`lowconf`,
> nunca `mismatch`), mantendo `C F G Am`→Am, `Am F G C`→C e o mismatch genuíno (diz G, é D → avisa).
> **Lição:** validar a detecção contra cifras que terminam fora da tônica, não só nas que resolvem.

## UI (sinalização discreta — só sugestão)
- Toggle **`#checkkey-toggle`** em **⚙ Ajustes da cifra → Afinação** ("Conferir tom pelos
  acordes"), `settings.checkKey` **off por padrão** (modelo do `autoPull`/`#tabs-toggle`).
- Aviso **`#keycheck`** (classe `.keyhint`, cor `--warn` suave, **não** vermelho) sob o Tom no
  ⚙, pintado por `updateKeyCheck()` no fim do `drawPlayer` — **só** quando o toggle está ligado
  **e** `compareKey` retorna `mismatch`. Texto: "Tom informado: X · provável pelos acordes: Y".
  Independe de transpor/capo (detecta sobre o tom/acordes **escritos**).
- **Importação:** o palpite de tom do `parseImport` (quando o texto não traz `Tom:`) passou a
  usar `detectKey` (fallback pro 1º acorde se incerto); e, com o recurso ligado, o toast de colar
  avisa se o `Tom:` do texto destoa dos acordes ("Tom G? os acordes sugerem D").

## Limites assumidos (honestidade)
- Sem duração de acorde; **um centro tonal por cifra** (não trata modulação seção-a-seção) —
  modulação real cai em confiança baixa → sem alarme.
- Off por padrão + tolerância a relativa + alarme só com confiança = baixíssimo risco de falso
  positivo. É **sugestão**, não correção automática.

## Fontes (teoria)
- Hoffman Academy — *Diatonic Chords in Major & Minor Keys* / *Minor Scale*
- StudyBass — *Minor Scale Diatonic Chord Qualities*; MusicTheory (Puget Sound) — *Diatonic Chords in Minor*
- LearnJazzStandards — *Diatonic Chords*; Wikipedia — *Relative key* / *Secondary chord*
- AP Music Theory (Fiveable) — *Relative minor key*; Musical-U — *Finding the Tonic in Minor Keys*
- rnhart.net e UC Press/*Music Perception* — *Krumhansl-Schmuckler* (referência conceitual)
- Uehara et al. 2019 (HMM, chord function + modulation); TheJazzPianoSite — *Analyse a Chord Progression*
