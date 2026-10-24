# LiDire — versão 122 — correção de notificações persistentes

## Correções
- A ação “Dar ciência” agora envia uma confirmação explícita ao Worker, que registra `acknowledged_at` no D1. A listagem normal deixa de devolver notificações reconhecidas, inclusive após recarregar, entrar novamente ou usar outro aparelho.
- A migração defensiva adiciona a coluna `acknowledged_at` à tabela `family_notifications` quando o Worker inicializa, preservando os registros existentes.
- “Marcar lida” continua diferente de “Dar ciência”: marcar lida não oculta a LD; dar ciência a oculta de forma persistente.
- Exclusão continua sendo registrada em `deleted_at`, com marcadores temporários no cliente para evitar que respostas antigas da API façam a notificação reaparecer durante a operação.
- Erros de servidor revertem a alteração visual e mostram uma mensagem, em vez de fingir que a ação foi salva.

## Validação executada
- `node --check app.js` — passou.
- `node --check index.js` — passou.
- Revisão estática dos caminhos de listagem, exclusão e ciência.

## Ainda necessário antes de considerar concluído
- Publicar o Worker e confirmar a migração automática da coluna no D1 correto.
- Testar com duas contas reais: dar ciência, excluir, atualizar a página, sair/entrar e verificar em outro aparelho.
- Nenhum deploy ou alteração remota no Cloudflare/D1 foi realizado por esta edição.
