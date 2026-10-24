# LiDire — Versão 121

## Correção solicitada
- Removida a inclusão automática de painéis “compartilhados comigo” de todas as abas individuais de recursos (Agenda, Compras, Estudos, Treinos, Hidratação, Alimentação, Finanças, Objetivos, Lembretes e demais módulos mapeados).
- A alteração é apenas de apresentação: não apaga registros compartilhados, não modifica permissões e não altera endpoints/API nem o banco D1.
- As atualizações dos membros da família continuam destinadas à tela inicial (somente quando há atualizações relevantes) e à aba Família.
- As LDs permanecem na área própria de LDs recebidas/enviadas, não no feed de atualizações.

## Validação
- Verificação de sintaxe JavaScript executada para `app.js` e `index.js`.
- Não foi realizado deploy nem teste integrado contra Cloudflare/D1.

## Correções adicionais — atualizações dos membros lentas e notificações excluídas que voltavam
**Notificações excluídas voltavam**
- Causa 1 (corrida): a consulta periódica de notificações podia começar antes de excluir e terminar depois; a resposta antiga sobrescrevia a lista e o item reaparecia (o mesmo valia para "Dar ciência"). Agora respostas mais antigas que uma consulta já iniciada (ou de outra conta) são descartadas, e exclusão, exclusão definitiva, esvaziar lixeira e ciência passam a valer na hora no aparelho (marcadores locais por até 2 min, removidos assim que o servidor confirma). Em caso de erro do servidor, a ação é revertida e o erro é mostrado.
- Causa 2 (persistência): as notificações eram gravadas no localStorage e reapareciam ao reabrir o app até a primeira consulta. Agora vêm sempre do servidor e não são persistidas.
- Causa 3: no feed "Atualizações dos membros", o botão "Dar ciência" não retirava o item da lista. Agora o item com ciência sai do feed.
- O servidor já fazia a exclusão corretamente (`deleted_at`); só foi adicionado `Cache-Control: no-store, private` na listagem.

**Atualizações dos membros demoravam a aparecer**
- Consulta periódica de 15 s para 8 s e atualização imediata ao voltar para a aba, ao focar a janela e ao recuperar a conexão (abas em segundo plano têm o timer limitado pelo navegador).
- A tela só é redesenhada quando algo muda (antes, Família era redesenhada a cada consulta).
- Mudança de data de uma notificação já existente também conta como alteração.
- Lado de quem altera: os avisos aos familiares passaram a ser enviados em paralelo e sem bloquear a fila de sincronização (antes, cada aviso esperava o anterior e atrasava a sincronização do módulo seguinte).
- Texto da notificação de tarefas mantido como na v120.

**Validação**: `node --check` em app.js e index.js; teste simulado com resposta atrasada (item excluído não reaparece). Falta testar com duas contas reais.

## Correção — gráfico de estudos e conclusão de tarefas da tela inicial
**Tela inicial (Produtividade / Tarefas)**
- "Produtividade" usava a fórmula `100 − pendentes × 5`: com nenhuma tarefa cadastrada aparecia 100%, e com 2 tarefas pendentes e 0 concluídas, 90%. Agora é a taxa real de conclusão: tarefas concluídas ÷ total. Sem tarefas, mostra 0% (nunca 100%).
- O cartão "Tarefas" mostrava pendentes/total; agora mostra concluídas/total, coerente com a porcentagem.

**Estudos – Progresso Semanal**
- A porcentagem do texto já partia de 0% ao criar um planejamento (verificado no app com a API simulada), mas o gráfico induzia a leitura de "tudo cheio": a barra do dia com mais estudo programado sempre ocupava 100% da altura, em cinza sólido, e o preenchimento de "concluído" era calculado sobre a altura já reduzida da barra (um dia 100% concluído aparecia ~50% preenchido).
- Preenchimento corrigido: cada barra agora é preenchida de 0 a 100% do próprio dia.
- A parte "programada" passou a ser uma faixa tracejada translúcida (vazia por padrão) e o "concluído" é o preenchimento roxo; a legenda acompanha.
- Cada dia com sessões mostra o percentual concluído abaixo da letra do dia ("0%", "100%"); dias sem sessões mostram "–".
- Arquivos: `app.js` e `styles.css`.

**Validação**: `node --check`; testado no Chromium com o app real: plano novo = 0% em todos os dias; após concluir sessões, os dias concluídos mostram 100% e o total semanal 43%; tela inicial com 0 tarefas = 0% e 0/0, 1 de 2 = 50% e 1/2, 2 de 2 = 100% e 2/2.

## Estudos — vários assuntos no mesmo dia
**Problema**: cada matéria gerava no máximo uma sessão por dia de estudo, com um único assunto escolhido em rodízio. Com 4 assuntos cadastrados e 2 dias por semana, o app entendia "1 assunto por dia" durante todo o período; "Tarefas de hoje" e o gráfico semanal só enxergavam esse assunto. O tempo informado em cada assunto também era ignorado (valia sempre o tempo da matéria).

**Correção**
- Nova opção em cada matéria: **Assuntos por dia de estudo** (1 em rodízio, 2, 3, 4, 5 ou "Todos os assuntos em cada dia"). Fica salva no planejamento e é restaurada ao editar.
- Com mais de um assunto no dia, cada assunto vira uma sessão própria e usa o seu "Tempo do assunto"; com um só (padrão), vale o tempo da matéria, como antes.
- Se houver mais assuntos do que o escolhido, eles entram em rodízio ao longo do período, sem repetir no mesmo dia (ex.: 4 assuntos, 2 por dia → Crase+Verbos num dia, Pontuação+Concordância no seguinte).
- "Tarefas de hoje", gráfico semanal (minutos programados/concluídos), lista de sessões, edição, exclusão, "concluído" e Pomodoro por sessão passam a considerar todos os assuntos do dia, pois usam a mesma geração de sessões.
- O cartão do planejamento mostra o resumo, ex.: "4 assuntos (todos no mesmo dia)".
- Compatibilidade: planejamentos antigos continuam com 1 assunto por dia; as 52 sessões de um plano de teste saíram idênticas (mesmos ids, datas, assuntos e "concluído" preservado). O primeiro assunto do dia mantém o id antigo; os demais usam o id do próprio assunto.
- Arquivo: `app.js`.

**Validação**: `node --check`; comparação do resultado antigo × novo; teste no Chromium criando pelo formulário um plano de 3 meses, 2 dias por semana, 4 assuntos, "Todos": as 4 sessões apareceram em "Tarefas de hoje" e o gráfico somou 120 min programados; o valor escolhido voltou ao reabrir o planejamento.

## Membros, grupos, convites e LDs voltavam depois de excluídos ou com ciência
**Membros da família**
- Causa: o botão de excluir pessoa só removia o item do aparelho; o servidor nunca era avisado. Na consulta seguinte (login, notificações, convites) a pessoa voltava. Além disso, `loadFamilyFromD1` mantinha qualquer cópia local que não viesse do servidor, ressuscitando quem foi excluído em outro aparelho.
- Correção: excluir pessoa agora pede confirmação, remove na hora e chama `DELETE /api/family/members/:id` (que também cancela convites pendentes e apaga cópias compartilhadas, B5). Um marcador local (5 min) impede que uma consulta atrasada traga a pessoa de volta; se o servidor recusar, a pessoa é restaurada na mesma posição com aviso. Só sobrevive localmente o rascunho que nunca teve `serverId`; quem tem `serverId` e não vem mais do servidor é removido.

**Convites de grupo (ciência e exclusão)**
- Causa: "Dar ciência" só gravava o id no localStorage do aparelho (sem separar por conta); o destinatário não tinha como excluir/ocultar um convite no servidor e o titular não podia remover convite já aceito (409). Outro aparelho, limpeza de cache ou outra conta no mesmo navegador faziam tudo reaparecer.
- Correção (servidor): `group_invitations` ganhou `owner_hidden_at` e `recipient_hidden_at`; `DELETE /api/groups/invitations/:id` agora aceita titular e destinatário. Titular: pendente é cancelado (some para os dois), já respondido sai só da lista dele. Destinatário: precisa responder antes (409 se pendente) e depois a ciência/exclusão fica gravada para ele. A listagem não devolve o que o próprio usuário ocultou; quando os dois ocultam, a linha é apagada.
- Correção (app): "Dar ciência", "Excluir convite" e "Excluir grupo" agora gravam no servidor, com efeito imediato e reversão em caso de erro. Ciências antigas guardadas só no aparelho são migradas para o servidor uma única vez.

**Grupos**
- Causa: ao excluir um grupo recebido, só a cópia local era apagada; o convite continuava no servidor e a consulta seguinte recriava o grupo.
- Correção: excluir grupo remove/oculta no servidor os convites dele (se houver convite recebido ainda pendente, pede para aceitar ou recusar antes). Convites que o servidor não lista mais saem da cópia local e o grupo criado só a partir deles desaparece junto.

**LDs (notificações)**
- Mantida a correção já entregue: marcadores locais de exclusão/ciência, descarte de respostas atrasadas e notificações não persistidas no aparelho. O que ainda voltava por esses caminhos era o convite ligado à LD, tratado acima.

**Validação**: `node --check` (app.js e index.js); teste no Chromium com servidor simulado e com estado: exclusão com DELETE lento + consulta no meio (pessoa não volta), exclusão em outro aparelho, rascunho local preservado, ciência + recarga, "outro aparelho" sem cache, excluir grupo + recarga, convite ocultado em outro aparelho; regras do servidor testadas com banco simulado (titular pendente/aceito, destinatário pendente/aceito/recusado, terceiro 404). Falta testar com D1 real e duas contas.
