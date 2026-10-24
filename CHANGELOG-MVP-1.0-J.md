# MVP-1.0J — Camada de IA independente do provedor

## Objetivo
Preparar a LiDire para testar diferentes provedores de IA sem reescrever os módulos e as ações do aplicativo.

## Alterações
- Criada seleção de provedor no Worker por `AI_PROVIDER` (padrão: `gemini`).
- Mantida a integração Gemini existente, incluindo Google Search grounding e fallback entre modelos Gemini.
- Adicionado adaptador para APIs compatíveis com OpenAI Chat Completions, incluindo OpenAI, Groq e endpoints compatíveis.
- Configuração de provedor alternativo por `AI_API_KEY`, `AI_MODEL` e opcionalmente `AI_BASE_URL`.
- Resposta da IA inclui o provedor, modelo, disponibilidade real de pesquisa e aviso quando a pesquisa web não estiver implementada para o provedor escolhido.
- Mensagem de limite agora é genérica ao provedor, sem mencionar exclusivamente o Google AI Studio.
- Histórico da conversa é convertido para o formato de mensagens de chat nos provedores compatíveis com OpenAI.

## Configuração
### Gemini (padrão)
- `AI_PROVIDER=gemini` (pode ser omitido)
- Secret `GEMINI_API_KEY`
- Opcional: `GEMINI_MODEL`

### OpenAI
- `AI_PROVIDER=openai`
- Secret `AI_API_KEY` contendo a chave da API OpenAI
- Opcional: `AI_MODEL` (padrão `gpt-4.1-mini`)
- Endpoint padrão: `https://api.openai.com/v1`

### Groq
- `AI_PROVIDER=groq`
- Secret `AI_API_KEY` contendo a chave da API Groq
- Opcional: `AI_MODEL` (padrão `llama-3.3-70b-versatile`)
- Endpoint padrão: `https://api.groq.com/openai/v1`

### Outro endpoint compatível
- `AI_PROVIDER=openai-compatible`
- Secret `AI_API_KEY`
- `AI_BASE_URL` deve apontar para a raiz da API compatível, terminando normalmente em `/v1`
- `AI_MODEL` deve ser definido para um modelo suportado pelo endpoint

## Limitações conhecidas
- Pesquisa Google integrada e extração de fontes continuam disponíveis apenas com Gemini nesta versão. Ao usar outro provedor, a resposta indica que a pesquisa web não está disponível por este adaptador; não deve alegar que pesquisou.
- O formato de saída estruturada é solicitado via `response_format: json_object`; a aplicação ainda deve validar as ações antes de executá-las.
- Esta alteração não ativa nem exige cobrança de um provedor alternativo.
- Nenhum deploy foi realizado e nenhuma base D1 foi alterada.

## Verificações realizadas
- `node --check index.js` passou sem erros de sintaxe.
- Testes de integração com provedores externos ainda precisam ser executados com credenciais válidas em ambiente de homologação.
