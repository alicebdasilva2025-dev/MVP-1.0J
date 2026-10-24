# LiDire MVP 1.0 — Escopo reduzido

## Alterações desta versão
- Congelada a tela de Ciclo Menstrual: exibe aviso explícito de funcionalidade em desenvolvimento e não apresenta ações de registro.
- Congelada a tela de Gestação: exibe aviso explícito de funcionalidade em desenvolvimento, sem ações de registro, e preserva o aviso permanente de acompanhamento médico.
- Removida a tela funcional de compartilhamento familiar. O botão/entrada de acesso permanece e abre uma mensagem explícita de funcionalidade em desenvolvimento.
- Ocultada a seção de atualizações dos membros da família durante o MVP 1.0.
- Atualizadas as descrições dos módulos no Explorar para informar que estão em desenvolvimento.
- Atualizados os metadados de versão para MVP 1.0.

## Observações importantes
- Esta alteração desativa a interface dessas funcionalidades; não apaga dados antigos do D1 nem executa migrações no Cloudflare.
- O Worker e o banco D1 não foram implantados ou modificados nesta entrega. Antes de um lançamento público, revise também os endpoints de compartilhamento e notificações no backend para garantir que não possam ser acionados diretamente por clientes.
- Necessário testar cadastro/login, navegação, módulos ativos e telas congeladas em ambiente de homologação.
