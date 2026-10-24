# LiDire MVP 117 — Compartilhamento de tarefas em leitura

## O que mudou

- Cada contato pode receber uma autorização explícita, desmarcada por padrão, para consultar todas as tarefas atuais e futuras do titular.
- O consentimento usa `shareTasksData`, separado das permissões antigas; nenhuma autorização legada libera tarefas automaticamente.
- O Worker publica apenas os campos necessários da tarefa e valida, em cada leitura, o vínculo familiar ativo e a autorização concedida pelo titular.
- A tela “Tarefas compartilhadas comigo” é separada das tarefas próprias e não oferece ações para editar, concluir ou excluir registros.
- Convites aceitos atualizam os vínculos e iniciam a sincronização a partir do dispositivo do titular; mudanças e exclusões de tarefas são enviadas ao servidor.
- A tabela aditiva `family_shared_tasks` é criada pelo código quando os novos endpoints são usados. Nenhum D1 foi alterado ao preparar este ZIP.
- Os controles de agenda, finanças e localização continuam sem sincronização real entre contas.

## Rotas adicionadas

- `GET /api/family/shared/tasks` — lista tarefas autorizadas para a conta autenticada.
- `POST /api/family/shared/tasks/sync` — sincroniza tarefas do titular autenticado, somente se houver ao menos um contato ativo autorizado.

## Verificação e limites

- A versão do app e os metadados estão identificados como 117. O nome configurado do Worker permanece `versao-92`.
- Esta entrega não executa migração no Cloudflare D1 e não faz deploy.
- `node --check` passou para o frontend e Worker; testes simulados confirmaram o bloqueio sem consentimento, a lista somente leitura, a filtragem de campos e a limpeza sem grants. O esquema e as consultas também passaram em SQLite local em memória.
- A confirmação funcional de ponta a ponta ainda requer teste em D1 de desenvolvimento com duas contas distintas, incluindo concessão, revogação, atualização, exclusão e recusa/aceite de convite. Nenhum teste usou o D1 conectado.
