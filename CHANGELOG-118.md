# LiDire — versão 118

## Compartilhamento familiar somente leitura por módulo

- Ampliado o mecanismo usado para tarefas para Agenda, Compras, Estudos, Treinos, Hidratação, Alimentação, Finanças, Objetivos e Lembretes.
- Cada módulo usa sua própria permissão familiar: `agenda`, `compras`, `estudos`, `treinos`, `hidratacao`, `alimentacao`, `financas`, `objetivos` e `lembretes`.
- Criada a tabela D1 `family_shared_resources`, separada por titular, módulo e registro, com atualização e remoção de registros compartilhados.
- Adicionados endpoints GET e POST `/api/family/shared/{modulo}` e `/api/family/shared/{modulo}/sync`.
- O backend exige sessão autenticada, vínculo familiar ativo e permissão explícita para o módulo consultado.
- Os módulos exibem uma seção “... compartilhados comigo”, em modo somente leitura, com o nome do familiar que compartilhou.
- As alterações de registros são sincronizadas a partir do estado local; exclusões são propagadas ao D1. A revogação da permissão limpa a cópia compartilhada daquele módulo.
- Dados sensíveis de autenticação e chaves são removidos da cópia compartilhada.

## Limitações e validação necessária

- A sincronização depende de contas vinculadas e ativas no D1 e das permissões do módulo.
- O mecanismo não transforma os dados locais em edição colaborativa; o destinatário apenas consulta.
- Ciclo menstrual e Gestação não foram incluídos nesta ampliação por envolverem dados de saúde sensíveis e estruturas específicas; exigem uma decisão explícita sobre escopo e validação dedicada.
- Verificações de sintaxe JavaScript realizadas em `app.js` e `index.js`. Não foi possível validar o comportamento com duas contas reais ou executar testes contra o D1/Cloudflare neste ambiente. Não houve deploy.
