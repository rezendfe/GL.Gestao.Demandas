# Arquitetura — EF-03

`Demanda.GarantirLeitura` aplica perfil, área e empresa. `AtendimentoAplicacao.Listar` e `Obter` chamam essa regra antes de montar o DTO. O portal usa a mesma fila em início, central e detalhe (`useFila`, `DetalhePage`).
