# Histórico de versões — Levita 🎸

App de cifras offline-first para ministério de música. Versionamento semântico
(`vMAIOR.MENOR.CORREÇÃO`): CORREÇÃO = conserto, MENOR = recurso novo, MAIOR =
mudança grande/incompatível. A versão atual aparece dentro do app, ao lado do nome.

---

---

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
