# LiDire — versão 119 — Correções de compartilhamento (tentativa inicial)

## Correções aplicadas
- Corrigido o gatilho de sincronização: alterações em módulos diferentes de Tarefas não dependem mais de uma alteração de tarefas.
- Permissões de compartilhamento antigas deixam de ser presumidas como consentimento: o backend exige `shareConsentVersion: 1`, gravado quando as permissões são explicitamente salvas. Contatos antigos precisam revisar e salvar suas permissões para voltar a compartilhar.
- Cache em memória dos módulos é limpo ao sair; caches identificam a conta atual.
- Exclusões pendentes são mantidas em uma fila local por usuário/módulo para nova tentativa após falha de rede.
- Removido o teto arbitrário de 200 registros nas consultas de tarefas e outros módulos (a consulta agora retorna todos os registros autorizados; validar custo de CPU em bases grandes).
- Envio dos módulos passou a enviar somente registros alterados, exceto quando há mudança de permissões, quando reenvia o conjunto autorizado para reconstruir a cópia.
- O carregamento inicial do módulo compartilhado é imediato, sem aguardar o polling de 15 segundos.
- Notificações de atualização continuam limitadas a alterações de dados detectadas; recomenda-se testar volume com várias pessoas.
- Campos exibidos na lista compartilhada variam conforme o módulo.
- O filtro de chaves sensíveis foi restringido a nomes de campos específicos; campos acima de 12.000 caracteres agora retornam erro explícito em vez de sumirem silenciosamente.
- Versão do aplicativo atualizada para 119 e changelog adicionado.

## Validação
- Requer executar verificações de sintaxe, revisar o diff e testar com duas contas reais e D1.
- Não foi feito deploy nem alteração em banco de produção.
- A fila de exclusões usa localStorage por conta; não é uma fila distribuída e precisa ser validada em cenário de troca de dispositivo.

## Correção B1 — gatilho da sincronização dos módulos (aplicada nesta revisão)
- O gatilho de `queueFamilyResourceUpdates` agora também dispara quando muda a permissão (ou o consentimento) de QUALQUER módulo, não só a de Tarefas. Antes, ligar/desligar Agenda, Compras etc. sem alterar dados saía na primeira linha de retorno e a cópia no servidor nunca era reconstruída/limpa.
- O filtro de destinatários no cliente não exige mais `userId`: contatos recém-cadastrados ou sincronizados por `syncFamilyMemberFromServer` não tinham esse campo e ficavam fora do envio. O servidor continua sendo a autoridade (família, status, `shareConsentVersion` e permissão no D1).
- `syncFamilyMemberFromServer` passa a preservar/gravar `userId`.
- Comparação de permissão por módulo centralizada em `familyModulePermissionFingerprint` e `familyActiveRecipients` (removida a lógica duplicada inline).
- Validação: `node --check app.js` OK. Falta testar com duas contas reais (ver roteiro na resposta).

## Correção B2 — permissões legadas sem consentimento (aplicada nesta revisão)
- Servidor: `shareConsentVersion: 1` deixou de ser carimbado automaticamente em todo POST/PUT de membro. Só é gravado quando o formulário envia `shareConsentConfirmed: true` (confirmação explícita do titular). Cadastros sem essa confirmação (ex.: assistente de IA) nascem com todo compartilhamento desligado; edições sem confirmação mantêm o que já estava gravado.
- Servidor: as chaves de permissão são filtradas por lista fixa e só `=== true` vale; qualquer `shareConsentVersion` enviado pelo cliente é ignorado.
- Servidor: `GET /api/family` e as respostas de POST/PUT devolvem permissões efetivas — contatos sem selo de consentimento voltam com tudo desligado e `consentRequired: true`.
- Cliente: `loadFamilyFromD1` e `syncFamilyMemberFromServer` não exibem mais permissões legadas como ativas (antes o formulário abria com as caixas marcadas e qualquer "Salvar" virava consentimento). O consentimento local agora vem sempre do servidor.
- Cliente: o padrão de "Lembretes" passou de ligado para desligado; o assistente não concede mais permissões (avisa o usuário para marcar em Família > Editar).
- Validação: `node --check` em app.js e index.js OK. Falta testar com D1 real (contato legado → abrir Editar → caixas desmarcadas → marcar e salvar → só então compartilha).
- Não alterado, mas a revisar: `updateFamilyMember` marca o contato como `active` sempre que existe uma conta com aquele e-mail, sem passar pelo aceite do convite.

## Correção — fluxo de convite familiar (aplicada nesta revisão)
- `updateFamilyMember` não marca mais o contato como `active` só porque existe uma conta com aquele e-mail. Editar nome, endereço ou permissões mantém o estado atual (`pending`, `pending_acceptance`, `active` ou `rejected`); antes, um contato recusado ou ainda sem aceite virava `active`.
- Trocar o e-mail de um contato agora é tratado como outra pessoa: o vínculo antigo (`user_id`) é removido, convites pendentes do contato são cancelados, as permissões anteriores não se transferem e, se o novo e-mail já tem conta, nasce `pending_acceptance` com convite e notificação.
- Contato `pending` que passa a ter conta (e-mail já cadastrado) vai para `pending_acceptance` e recebe convite ao ser editado; o e-mail do próprio titular nunca gera convite.
- `sendFamilyNotification` não vincula nem ativa mais o contato por conta própria; só entrega a quem está `active`/`accepted` (senão responde 409 `invite_not_accepted`).
- Cliente: o envio de notificações da fila de sincronização passou a ser tolerante a falha (`familyNotifySafe`), para uma recusa do servidor não interromper a sincronização dos demais módulos.
- Validação: `node --check` em app.js e index.js OK. Falta testar com duas contas reais: criar convite, editar antes do aceite (continua pendente), recusar e editar (continua recusado), trocar e-mail.

## Correção B3 — cache dos módulos ao sair ou trocar de conta (aplicada nesta revisão)
- A limpeza de caches compartilhados agora é uma única função (`clearSharedCachesForAccountChange`): invalida respostas em voo, zera o cache de tarefas e o de todos os módulos e remove as marcas `lidire_shared_cache_owner_*` do localStorage.
- Todos os pontos de saída chamam essa função: logout, exclusão de conta, sessão perdida em `loadCurrentUser`, redefinição de senha, volta ao login pela tela de redefinição, abertura por link de convite e `initAuth` com token de redefinição. Antes, só o logout limpava os módulos; os demais limpavam apenas o cache de Tarefas, e dados compartilhados da conta anterior podiam aparecer para a próxima.
- `loadSharedFamilyResources` passou a usar a versão de sessão: uma resposta que chega depois de sair ou trocar de conta é descartada em vez de preencher o cache da conta nova.
- Validação: `node --check app.js` OK. Falta testar: entrar na conta A, abrir "compartilhados comigo" em Agenda/Compras, sair, entrar na B e confirmar que a seção começa vazia; repetir com exclusão de conta e com sessão expirada.
- Não alterado: se a sessão expirar sem logout e outra pessoa entrar no mesmo aparelho, os dados locais (`lidire-mvp-data`) da conta anterior continuam no navegador, pois apagá-los pode perder dados de quem só está reabrindo a própria conta.

## Correção B4 — falha de rede perdia exclusões (aplicada nesta revisão)
- A fila de exclusões pendentes só era retomada se o mesmo módulo fosse alterado de novo, e uma falha em um módulo abortava a sincronização dos seguintes. Sem nova alteração, a exclusão nunca chegava ao servidor.
- `queueFamilyResourceUpdates` foi reescrita sobre um único fluxo por módulo (`runFamilyModuleSync`), que também substitui o bloco duplicado de Tarefas. Exclusões são gravadas no localStorage no próprio salvamento (antes de qualquer chamada de rede) e só saem da fila depois que o servidor confirma o lote.
- Nova marca "reenvio total pendente" por conta e módulo: se uma sincronização falhar, a próxima reenvia o conjunto autorizado completo, então alterações (não só exclusões) feitas offline também não se perdem.
- Falha em um módulo não interrompe os outros.
- Nova `retryPendingFamilySync`: roda ao carregar a família (login e sessão restaurada), ao voltar a ficar online, ao voltar para a aba e a cada 60 s, só quando há algo pendente.
- Exclusão antiga que ficou na fila não apaga um item que voltou a existir com o mesmo id.
- Excluir a conta remove a fila daquela conta; sair da conta mantém a fila (por usuário) para retomar no próximo login.
- Removidas as definições duplicadas das funções da fila.
- Efeito colateral positivo: o servidor deixou de receber um lote vazio de Tarefas a cada salvamento (parte do B8). As notificações agora só saem quando o servidor confirma `shared: true`.
- Validação: `node --check` OK e teste com simulação de falha de rede (exclusão e alteração retomadas sem novo salvamento; item recriado não é apagado). Falta testar em dois dispositivos reais.
- Limite conhecido: a fila é por navegador. Excluir em um aparelho e a rede cair antes de reabrir outro aparelho não é coberto. A notificação de uma alteração cujo envio falhou não é reenviada na retomada.

## Correção B5 — revogar permissão não apagava a cópia no servidor (aplicada nesta revisão)
- A limpeza só acontecia quando o app do titular enviava uma sincronização (e só se ele estivesse online). Revogar uma permissão, remover o contato, recusar o convite ou o destinatário excluir a conta deixava a cópia em `family_shared_tasks` / `family_shared_resources` indefinidamente.
- Novo `purgeUnauthorizedSharedCopies` (servidor): apaga as cópias de qualquer módulo que não tenha mais ao menos um destinatário autorizado (status `active`/`accepted`, `shareConsentVersion` e permissão do módulo). Se outro familiar ainda tem a permissão, a cópia desse módulo é mantida.
- Chamado em: editar membro (`updateFamilyMember`), excluir membro (`deleteFamilyMember`, que agora também cancela convites pendentes dele), recusar convite (`respondFamilyInvitation`) e excluir conta (`deleteAccount`, que também remove os vínculos dessa conta nos grupos de outros titulares e limpa as cópias deles). Falha na limpeza é registrada, não derruba a operação; o reenvio do B4 cobre o resto.
- As leituras já exigiam permissão vigente; agora o dado também deixa de existir no banco.
- Validação: `node --check` OK e teste da lógica com banco simulado (2 módulos autorizados, um revogado, sem consentimento, sem membros). Falta testar no D1 real.
- Limite: a cópia é por titular/módulo, não por destinatário. Revogar um familiar não apaga a cópia enquanto outro ainda tem a permissão, e quem foi revogado continua sem acesso porque a leitura confere a permissão.

## Correção B6 — textos que contradiziam o que é compartilhado (aplicada nesta revisão)
- Lista de membros: "Compartilhado com você" estava invertido (as permissões do cadastro são o que VOCÊ compartilha com a pessoa). Passou a "Você compartilha com esta pessoa", com a dica de onde ver o que ela compartilha com você ("compartilhados comigo", em cada módulo).
- Resumo de permissões: contato com convite pendente mostra "nada é enviado até o convite ser aceito"; contato legado sem consentimento mostra "revise e salve as permissões para liberar".
- Cartão "Compartilhamento ativo" listava só quem recebia Tarefas, com título "Tarefas compartilhadas"; agora lista quem recebe qualquer módulo.
- "Recursos compartilhados": os três interruptores (Sincronizar Agendas, Finanças Compartilhadas, Localização em Tempo Real) só alteravam uma preferência local e não liberavam nada, e a nota dizia que agenda e finanças não compartilhavam (falso desde a v118). Agora Agenda e Finanças aparecem como "Por contato" (liberadas em Adicionar/Editar pessoa), Localização como "Indisponível", e a nota descreve o modelo real.
- Formulário de permissões: removida a opção "Ciclo menstrual" (não existe sincronização desse módulo; parecia compartilhar e não compartilhava). O texto agora informa: somente leitura, só vale após o aceite, sem senhas/credenciais, dados de saúde não são compartilhados, e que desmarcar remove a cópia do servidor.
- Políticas (Privacidade, Termos e Política de IA): o texto de revogação passou a dizer o que acontece de fato (bloqueia consultas e remove a cópia no servidor quando nenhum outro contato autorizado a usa; remover contato ou excluir conta também apaga as cópias), alinhado ao B5.
- Compras: subtítulo "organizadas e compartilhadas" trocado (a lista não é compartilhada por padrão).
- Configurações > Conectividade: "Compartilhamento Familiar: ATIVO" era fixo; agora mostra ATIVO só se algum contato aceito recebe algum módulo, senão "SEM COMPARTILHAMENTO".
- Convite: a caixa de confirmação passou a explicar que aceitar não compartilha os seus dados e que cada pessoa define o que compartilha, módulo a módulo, somente para leitura.
- Validação: `node --check` OK. Falta conferir visualmente as telas Família, Configurações e o formulário de permissões. Os detalhes exibidos por módulo (B10) não foram alterados aqui.
