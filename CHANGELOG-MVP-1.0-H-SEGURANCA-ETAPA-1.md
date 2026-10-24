# MVP-1.0H — Segurança, etapa 1

Base: MVP-1.0G enviada para esta conversa.

## Correções incluídas

1. **Autenticação no servidor:** o login passa a enviar a senha ao endpoint próprio via HTTPS e o Worker valida com `verifyPassword` contra o hash PBKDF2. O fluxo anterior de prova HMAC baseada no verificador armazenado foi desativado, pois o hash do banco não deve funcionar como credencial equivalente.
2. **Alteração de senha:** a senha atual é verificada no servidor; a nova senha é validada e o hash PBKDF2 é calculado no Worker. Após a troca, as outras sessões da conta são encerradas.
3. **Limitação de tentativas:** adicionada limitação por IP para login (10 tentativas por 15 minutos) e cadastro (5 tentativas por hora), usando tabela de controle no D1 criada defensivamente pelo Worker.
4. **Alteração de e-mail:** bloqueada até existir um fluxo de verificação do novo endereço. A interface também impede a tentativa para evitar alteração apenas local.
5. **Cabeçalhos de segurança para API:** adicionados `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e `Cache-Control: no-store`.
6. **Compatibilidade de interface:** fluxo de login e troca de senha atualizado para corresponder ao novo contrato do Worker.

## Limites e testes pendentes

- `node --check app.js` e `node --check index.js` passaram.
- Integridade do ZIP deve ser conferida após empacotamento.
- Testar login válido/inválido, rate limit, alteração de senha, encerramento das outras sessões e edição de e-mail em ambiente de homologação.
- A limitação por IP no D1 é uma proteção inicial; para defesa mais robusta, configurar Cloudflare Rate Limiting/WAF também.
- Esta etapa não corrige ainda o escopo de dados enviados ao Gemini, OAuth/Gmail, proteção de dados no `localStorage`, exclusão integral de conta ou documentos LGPD.
- Nenhum deploy foi realizado. Nenhuma consulta ou alteração direta foi feita no banco D1 de produção.
