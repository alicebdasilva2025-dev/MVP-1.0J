# MVP-1.0I — Remoção da conectividade com Gmail e atalhos de perfil

## Alterações
- Removida da tela Perfil a seção Conectividade, incluindo o atalho de Compartilhamento Familiar e os controles do Gmail.
- Bloqueadas no Worker as rotas `/api/gmail/*` e `/api/connections/gmail*`, retornando HTTP 410.
- O endpoint de conexões informa Gmail como não configurado e desconectado.
- Desativada a execução agendada de acompanhamentos do Gmail.
- Mantidos os demais métodos de autenticação da conta Google sem alterar o login da LiDire.
- Nenhum deploy foi realizado e nenhum banco foi modificado.

## Observação importante
Esta alteração impede que a aplicação use a integração Gmail, mas não apaga automaticamente registros antigos de tokens já armazenados no D1 nem revoga tokens junto ao Google. Isso deve ser tratado como limpeza separada, com procedimento explícito e validado.
