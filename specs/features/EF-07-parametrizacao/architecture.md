# Arquitetura — EF-07

`CatalogoAdministracaoAplicacao` grava cadastro, inclusive o modelo de abertura da categoria. `CadeiaAplicacao` grava a cadeia. Só o GL / Administrador passa na aplicação. Portal: `CadastrosPage`, `CadeiaPage` e o formulário de abertura, que só lê o modelo. O classificador e o atraso leem o que foi gravado, sem lista fixa de categoria no código de roteamento.
