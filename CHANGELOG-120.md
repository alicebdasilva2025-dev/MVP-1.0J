# LiDire — versão 120

## Alterações solicitadas
- Removida a seção “Tarefas compartilhadas comigo” da aba Tarefas; não havia outras chamadas de renderização dessa seção nas demais abas de recursos.
- Atualizações de membros da família agora são renderizadas na aba Família e na tela inicial somente quando há atualizações relevantes.
- O feed de atualizações exclui mensagens/LDs familiares e notificações de convite, para manter as LDs na área “LDs recebidas e enviadas”.
- A caixa “LDs recebidas e enviadas” deixa de listar notificações de atualização de recursos compartilhados.
- Texto de notificação de tarefa compartilhada atualizado para não apontar para a seção removida.
- Versão do aplicativo atualizada para 120.

## Validação
- `node --check app.js`: aprovado.
- `node --check index.js`: aprovado; o Worker não foi alterado.
- Não foi feito deploy, nenhuma alteração foi feita no D1 e nenhuma publicação foi realizada.
- Testes de interface e integração entre duas contas ainda precisam ser executados no ambiente de teste.
