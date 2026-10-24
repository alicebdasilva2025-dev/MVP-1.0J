# Auditoria — congelamento do módulo Família

- Desativada a consulta/resposta automática de convites familiares no frontend.
- Notificações antigas identificadas como convites de Família/Grupos não geram toast nem sincronização familiar.
- Endpoints de convite familiar e de grupo respondem HTTP 410 nesta versão.
- Dados persistidos, foto de perfil, contas e tabelas do D1 não foram apagados ou alterados.
- O backend ainda contém outras rotas do módulo Família (membros/recursos compartilhados); esta correção bloqueia o fluxo de convites, não remove todo o código do módulo.
- Nenhum deploy foi realizado. Para que o bloqueio de backend tenha efeito, o Worker precisará ser publicado manualmente após revisão.
