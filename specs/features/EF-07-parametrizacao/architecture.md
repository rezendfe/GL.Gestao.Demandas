# Arquitetura — EF-07

`CatalogoAdministracaoAplicacao` grava cadastro. `CadeiaAplicacao` grava a cadeia. Só o GL / Administrador passa na aplicação. Portal: `CadastrosPage`, `CadeiaPage`. O classificador e o atraso leem o que foi gravado, sem lista fixa de categoria no código de roteamento.
