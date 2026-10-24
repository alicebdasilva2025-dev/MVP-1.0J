# LiDire MVP-1.0-A — Correção A: complexidade da senha no cadastro

## Alterações
- O cadastro exige senha com no mínimo 8 caracteres.
- A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial.
- A interface informa os requisitos e valida a senha antes de enviar o cadastro.
- O Cloudflare Worker valida os mesmos critérios no endpoint `/api/register`, impedindo contornar a regra chamando a API diretamente.
- O fluxo de login existente não recebeu a nova regra de complexidade, para manter compatibilidade com contas já existentes.

## Arquivos alterados
- `app.js`: texto de ajuda, validação e padrão do campo de senha no formulário de cadastro.
- `index.js`: validação de complexidade no backend no endpoint de cadastro.

## Verificações realizadas
- `node --check app.js` — passou.
- `node --check index.js` — passou.

## Testes manuais ainda necessários
- Senha fraca deve ser recusada pela interface e pelo backend.
- Senha válida, por exemplo `MinhaSenha8!`, deve passar pela validação de formato.
- Confirmar que senha e confirmação divergentes continuam sendo recusadas.
- Confirmar que contas existentes continuam entrando normalmente.

## Implantação
Nenhuma implantação foi realizada. Não houve alteração no Cloudflare Worker publicado nem no banco D1.
