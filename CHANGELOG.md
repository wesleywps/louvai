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
