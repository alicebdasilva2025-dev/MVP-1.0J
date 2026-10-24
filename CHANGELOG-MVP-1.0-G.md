# MVP-1.0G — Correção da exportação de dados

- Remove foto/avatar e campos que contenham dados de imagem do relatório.
- Incorpora o logotipo oficial no HTML do relatório, sem depender de uma URL externa.
- Exclui da exportação os módulos Família, Gestação e Ciclo Menstrual, incluindo dados locais e tabelas específicas do ciclo.
- Mantém o relatório em português e exibe valores ausentes como “Não consta”.
- Oculta identificadores técnicos internos na apresentação dos registros.
- Não houve publicação no Cloudflare nem alteração no banco D1.
- Validação realizada: sintaxe JavaScript e integridade do ZIP. Teste final deve ser feito no ambiente de homologação.
