using Microsoft.EntityFrameworkCore;

namespace Gl.Demandas.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    internal DbSet<AreaRegistro> Areas => Set<AreaRegistro>();
    internal DbSet<CategoriaRegistro> Categorias => Set<CategoriaRegistro>();
    internal DbSet<SubcategoriaRegistro> Subcategorias => Set<SubcategoriaRegistro>();
    internal DbSet<UsuarioRegistro> Usuarios => Set<UsuarioRegistro>();
    internal DbSet<EmpresaCessionariaRegistro> EmpresasCessionarias => Set<EmpresaCessionariaRegistro>();
    internal DbSet<EspacoRegistro> Espacos => Set<EspacoRegistro>();
    internal DbSet<LocacaoRegistro> Locacoes => Set<LocacaoRegistro>();
    internal DbSet<RepresentanteContatoRegistro> ContatosRepresentante => Set<RepresentanteContatoRegistro>();
    internal DbSet<FuncaoCessionarioRegistro> FuncoesCessionario => Set<FuncaoCessionarioRegistro>();
    internal DbSet<FuncaoPermissaoRegistro> PermissoesFuncao => Set<FuncaoPermissaoRegistro>();
    internal DbSet<RepresentanteFuncaoRegistro> FuncoesRepresentante => Set<RepresentanteFuncaoRegistro>();
    internal DbSet<RegraRegistro> Regras => Set<RegraRegistro>();
    internal DbSet<DemandaRegistro> Demandas => Set<DemandaRegistro>();
    internal DbSet<MensagemRegistro> Mensagens => Set<MensagemRegistro>();
    internal DbSet<AnexoRegistro> Anexos => Set<AnexoRegistro>();
    internal DbSet<HistoricoRegistro> Historicos => Set<HistoricoRegistro>();
    internal DbSet<DecisaoRegistro> Decisoes => Set<DecisaoRegistro>();
    internal DbSet<ObraRegistro> Obras => Set<ObraRegistro>();
    internal DbSet<DocumentoObraRegistro> DocumentosObra => Set<DocumentoObraRegistro>();
    internal DbSet<NotificacaoRegistro> Notificacoes => Set<NotificacaoRegistro>();
    internal DbSet<InscricaoPushRegistro> InscricoesPush => Set<InscricaoPushRegistro>();
    internal DbSet<EtapaCadeiaRegistro> EtapasCadeia => Set<EtapaCadeiaRegistro>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("app");

        modelBuilder.Entity<AreaRegistro>(b =>
        {
            b.ToTable("Area");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Area").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Area");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Area_CD_Area");
            b.Property(x => x.Nome).HasColumnName("NM_Area").HasMaxLength(120);
            b.Property(x => x.Status).HasColumnName("SG_Status").HasMaxLength(20);
        });

        modelBuilder.Entity<CategoriaRegistro>(b =>
        {
            b.ToTable("Categoria");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Categoria").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Categoria");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Categoria_CD_Categoria");
            b.Property(x => x.Nome).HasColumnName("NM_Categoria").HasMaxLength(120);
            b.Property(x => x.PrazoHoras).HasColumnName("NR_Prazo_Horas");
            b.Property(x => x.Status).HasColumnName("SG_Status").HasMaxLength(20);
        });

        modelBuilder.Entity<SubcategoriaRegistro>(b =>
        {
            b.ToTable("Subcategoria");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Subcategoria").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Subcategoria");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Subcategoria_CD_Subcategoria");
            b.Property(x => x.CategoriaIdInterno).HasColumnName("ID_Categoria");
            b.Property(x => x.AreaIdInterno).HasColumnName("ID_Area");
            b.Property(x => x.Nome).HasColumnName("NM_Subcategoria").HasMaxLength(120);
            b.Property(x => x.Fluxo).HasColumnName("SG_Fluxo").HasMaxLength(20);
            b.Property(x => x.Status).HasColumnName("SG_Status").HasMaxLength(20);
            b.HasOne(x => x.Categoria).WithMany().HasForeignKey(x => x.CategoriaIdInterno).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Area).WithMany().HasForeignKey(x => x.AreaIdInterno).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UsuarioRegistro>(b =>
        {
            b.ToTable("Usuario");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Usuario").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Usuario");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Usuario_CD_Usuario");
            b.Property(x => x.Nome).HasColumnName("NM_Usuario").HasMaxLength(200);
            b.Property(x => x.Email).HasColumnName("DS_Email").HasMaxLength(320);
            b.HasIndex(x => x.Email).IsUnique().HasDatabaseName("UK_Usuario_DS_Email");
            b.Property(x => x.IdentidadeEstavel).HasColumnName("DS_Identidade_Entra").HasMaxLength(200);
            b.HasIndex(x => x.IdentidadeEstavel).IsUnique().HasFilter("[DS_Identidade_Entra] IS NOT NULL").HasDatabaseName("UK_Usuario_Identidade_Entra");
            b.Property(x => x.SenhaHash).HasColumnName("DS_Senha_Hash").HasMaxLength(64);
            b.Property(x => x.Perfil).HasColumnName("SG_Perfil").HasMaxLength(40);
            b.Property(x => x.Empresa).HasColumnName("NM_Empresa").HasMaxLength(200);
            b.Property(x => x.Sala).HasColumnName("DS_Sala").HasMaxLength(80);
            b.Property(x => x.LogoEmpresa).HasColumnName("DS_Logo_Empresa").HasMaxLength(300);
            b.Property(x => x.Foto).HasColumnName("DS_Foto").HasMaxLength(300);
            b.Property(x => x.AreaIdInterno).HasColumnName("ID_Area");
            b.Property(x => x.EmpresaCessionariaIdInterno).HasColumnName("ID_Empresa_Cessionaria");
            b.Property(x => x.Status).HasColumnName("SG_Status").HasMaxLength(20);
            b.HasOne(x => x.Area).WithMany().HasForeignKey(x => x.AreaIdInterno).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.EmpresaCessionaria).WithMany().HasForeignKey(x => x.EmpresaCessionariaIdInterno).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EmpresaCessionariaRegistro>(b =>
        {
            b.ToTable("Empresa_Cessionaria");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Empresa_Cessionaria").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Empresa_Cessionaria");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Empresa_Cessionaria_CD");
            b.Property(x => x.Nome).HasColumnName("NM_Empresa").HasMaxLength(200);
            b.Property(x => x.Status).HasColumnName("SG_Status").HasMaxLength(20);
            b.Property(x => x.Logo).HasColumnName("DS_Logo").HasMaxLength(300);
            b.HasIndex(x => x.Nome).IsUnique().HasDatabaseName("UK_Empresa_Cessionaria_NM");
        });

        modelBuilder.Entity<EspacoRegistro>(b =>
        {
            b.ToTable("Espaco");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Espaco").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Espaco");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Espaco_CD");
            b.Property(x => x.Codigo).HasColumnName("CD_Identificacao").HasMaxLength(40);
            b.HasIndex(x => x.Codigo).IsUnique().HasDatabaseName("UK_Espaco_Identificacao");
            b.Property(x => x.Nome).HasColumnName("NM_Espaco").HasMaxLength(120);
            b.Property(x => x.Localizacao).HasColumnName("DS_Localizacao").HasMaxLength(240);
            b.Property(x => x.Descricao).HasColumnName("DS_Descricao").HasMaxLength(1000);
            b.Property(x => x.Status).HasColumnName("SG_Status").HasMaxLength(20);
        });

        modelBuilder.Entity<LocacaoRegistro>(b =>
        {
            b.ToTable("Locacao");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Locacao").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Locacao");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Locacao_CD");
            b.Property(x => x.EspacoIdInterno).HasColumnName("ID_Espaco");
            b.Property(x => x.EmpresaIdInterno).HasColumnName("ID_Empresa_Cessionaria");
            b.Property(x => x.Inicio).HasColumnName("DT_Inicio");
            b.Property(x => x.Termino).HasColumnName("DT_Termino");
            b.HasIndex(x => x.EspacoIdInterno)
                .IsUnique()
                .HasFilter("[DT_Termino] IS NULL")
                .HasDatabaseName("UK_Locacao_Espaco_Vigente");
            b.HasOne(x => x.Espaco).WithMany(x => x.Locacoes).HasForeignKey(x => x.EspacoIdInterno).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Empresa).WithMany().HasForeignKey(x => x.EmpresaIdInterno).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RepresentanteContatoRegistro>(b =>
        {
            b.ToTable("Representante_Contato");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Representante_Contato").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Representante_Contato");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Representante_Contato_CD");
            b.Property(x => x.UsuarioIdInterno).HasColumnName("ID_Usuario");
            b.Property(x => x.Canal).HasColumnName("SG_Canal").HasMaxLength(20);
            b.Property(x => x.Valor).HasColumnName("DS_Valor").HasMaxLength(320);
            b.Property(x => x.Principal).HasColumnName("FL_Principal");
            b.HasIndex(x => new { x.UsuarioIdInterno, x.Canal }).IsUnique().HasFilter("[FL_Principal] = 1").HasDatabaseName("UK_Representante_Contato_Principal");
            b.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioIdInterno).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FuncaoCessionarioRegistro>(b =>
        {
            b.ToTable("Funcao_Cessionario");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Funcao_Cessionario").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Funcao_Cessionario");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Funcao_Cessionario_CD");
            b.Property(x => x.EmpresaIdInterno).HasColumnName("ID_Empresa_Cessionaria");
            b.Property(x => x.Nome).HasColumnName("NM_Funcao").HasMaxLength(100);
            b.Property(x => x.Status).HasColumnName("SG_Status").HasMaxLength(20);
            b.HasIndex(x => new { x.EmpresaIdInterno, x.Nome }).IsUnique().HasDatabaseName("UK_Funcao_Cessionario_Empresa_Nome");
            b.HasOne(x => x.Empresa).WithMany().HasForeignKey(x => x.EmpresaIdInterno).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FuncaoPermissaoRegistro>(b =>
        {
            b.ToTable("Funcao_Cessionario_Permissao");
            b.HasKey(x => new { x.FuncaoIdInterno, x.Permissao });
            b.Property(x => x.FuncaoIdInterno).HasColumnName("ID_Funcao_Cessionario");
            b.Property(x => x.Permissao).HasColumnName("SG_Permissao").HasMaxLength(40);
            b.HasOne(x => x.Funcao).WithMany(x => x.Permissoes).HasForeignKey(x => x.FuncaoIdInterno).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RepresentanteFuncaoRegistro>(b =>
        {
            b.ToTable("Representante_Funcao");
            b.HasKey(x => new { x.UsuarioIdInterno, x.FuncaoIdInterno });
            b.Property(x => x.UsuarioIdInterno).HasColumnName("ID_Usuario");
            b.Property(x => x.FuncaoIdInterno).HasColumnName("ID_Funcao_Cessionario");
            b.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioIdInterno).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Funcao).WithMany().HasForeignKey(x => x.FuncaoIdInterno).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RegraRegistro>(b =>
        {
            b.ToTable("Regra_Classificacao");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Regra").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Regra");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Regra_Classificacao_CD_Regra");
            b.Property(x => x.Termo).HasColumnName("DS_Termo").HasMaxLength(80);
            b.Property(x => x.SubcategoriaIdInterno).HasColumnName("ID_Subcategoria");
            b.Property(x => x.Servico).HasColumnName("NM_Servico").HasMaxLength(120);
            b.Property(x => x.Destino).HasColumnName("DS_Destino").HasMaxLength(120);
            b.Property(x => x.Resumo).HasColumnName("DS_Resumo").HasMaxLength(200);
            b.Property(x => x.Prioridade).HasColumnName("SG_Prioridade").HasMaxLength(20);
            b.Property(x => x.OrdemPrioridade).HasColumnName("NR_Prioridade");
            b.Property(x => x.Confianca).HasColumnName("SG_Confianca").HasMaxLength(20);
            b.Property(x => x.Ordem).HasColumnName("NR_Ordem");
            b.HasOne(x => x.Subcategoria).WithMany().HasForeignKey(x => x.SubcategoriaIdInterno).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DemandaRegistro>(b =>
        {
            b.ToTable("Demanda");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Demanda").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Demanda");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Demanda_CD_Demanda");
            b.Property(x => x.Protocolo).HasColumnName("CD_Protocolo").HasMaxLength(20);
            b.HasIndex(x => x.Protocolo).IsUnique().HasDatabaseName("UK_Demanda_CD_Protocolo");
            b.Property(x => x.CessionarioIdInterno).HasColumnName("ID_Cessionario");
            b.Property(x => x.EmpresaCessionariaIdInterno).HasColumnName("ID_Empresa_Cessionaria");
            b.Property(x => x.Empresa).HasColumnName("NM_Empresa").HasMaxLength(200);
            b.Property(x => x.Sala).HasColumnName("DS_Sala").HasMaxLength(80);
            b.Property(x => x.Descricao).HasColumnName("DS_Descricao").HasMaxLength(2000);
            b.Property(x => x.Ponto).HasColumnName("DS_Ponto").HasMaxLength(200);
            b.Property(x => x.CategoriaIdInterno).HasColumnName("ID_Categoria");
            b.Property(x => x.SubcategoriaIdInterno).HasColumnName("ID_Subcategoria");
            b.Property(x => x.AreaIdInterno).HasColumnName("ID_Area");
            b.Property(x => x.ResponsavelIdInterno).HasColumnName("ID_Responsavel");
            b.Property(x => x.Servico).HasColumnName("NM_Servico").HasMaxLength(120);
            b.Property(x => x.Destino).HasColumnName("DS_Destino").HasMaxLength(120);
            b.Property(x => x.Situacao).HasColumnName("SG_Situacao").HasMaxLength(40);
            b.Property(x => x.Prioridade).HasColumnName("SG_Prioridade").HasMaxLength(20);
            b.Property(x => x.OrdemPrioridade).HasColumnName("NR_Prioridade");
            b.Property(x => x.Confianca).HasColumnName("SG_Confianca").HasMaxLength(20);
            b.Property(x => x.Classificacao).HasColumnName("SG_Classificacao").HasMaxLength(20);
            b.Property(x => x.Fluxo).HasColumnName("SG_Fluxo").HasMaxLength(20);
            b.Property(x => x.AbertoEm).HasColumnName("DT_Abertura");
            b.Property(x => x.AtualizadoEm).HasColumnName("DT_Atualizacao");
            b.Property(x => x.PrevisaoAtendimento).HasColumnName("DT_Previsao_Atendimento");
            b.Property(x => x.Natureza).HasColumnName("SG_Natureza").HasMaxLength(20);
            b.Property(x => x.NotaAvaliacao).HasColumnName("NR_Nota_Avaliacao");
            b.Property(x => x.ComentarioAvaliacao).HasColumnName("DS_Comentario_Avaliacao").HasMaxLength(500);
            b.Property(x => x.AvaliadaEm).HasColumnName("DT_Avaliacao");
            b.HasIndex(x => x.Situacao).HasDatabaseName("IX_Demanda_Situacao");
            b.HasIndex(x => x.AreaIdInterno).HasDatabaseName("IX_Demanda_Area");
            b.HasIndex(x => x.CessionarioIdInterno).HasDatabaseName("IX_Demanda_Cessionario");
            b.HasOne(x => x.Cessionario).WithMany().HasForeignKey(x => x.CessionarioIdInterno).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.EmpresaCessionaria).WithMany().HasForeignKey(x => x.EmpresaCessionariaIdInterno).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Responsavel).WithMany().HasForeignKey(x => x.ResponsavelIdInterno).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Categoria).WithMany().HasForeignKey(x => x.CategoriaIdInterno).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Subcategoria).WithMany().HasForeignKey(x => x.SubcategoriaIdInterno).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Area).WithMany().HasForeignKey(x => x.AreaIdInterno).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MensagemRegistro>(b =>
        {
            b.ToTable("Mensagem");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Mensagem").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Mensagem");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Mensagem_CD_Mensagem");
            b.Property(x => x.DemandaIdInterno).HasColumnName("ID_Demanda");
            b.Property(x => x.AutorIdInterno).HasColumnName("ID_Autor");
            b.Property(x => x.Texto).HasColumnName("DS_Texto").HasMaxLength(2000);
            b.Property(x => x.Canal).HasColumnName("SG_Canal").HasMaxLength(20);
            b.Property(x => x.Finalidade).HasColumnName("SG_Finalidade").HasMaxLength(20);
            b.Property(x => x.EnviadaEm).HasColumnName("DT_Envio");
            b.HasOne(x => x.Demanda).WithMany(x => x.Mensagens).HasForeignKey(x => x.DemandaIdInterno).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Autor).WithMany().HasForeignKey(x => x.AutorIdInterno).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AnexoRegistro>(b =>
        {
            b.ToTable("Anexo");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Anexo").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Anexo");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Anexo_CD_Anexo");
            b.Property(x => x.DemandaIdInterno).HasColumnName("ID_Demanda");
            b.Property(x => x.Nome).HasColumnName("NM_Arquivo").HasMaxLength(260);
            b.Property(x => x.Caminho).HasColumnName("DS_Caminho").HasMaxLength(500);
            b.Property(x => x.Tipo).HasColumnName("SG_Tipo_Midia").HasMaxLength(120);
            b.Property(x => x.Tamanho).HasColumnName("MD_Tamanho_Bytes");
            b.Property(x => x.EnviadoEm).HasColumnName("DT_Envio");
            b.HasOne(x => x.Demanda).WithMany(x => x.Anexos).HasForeignKey(x => x.DemandaIdInterno).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HistoricoRegistro>(b =>
        {
            b.ToTable("Historico_Demanda");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Historico").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Historico");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Historico_Demanda_CD_Historico");
            b.Property(x => x.DemandaIdInterno).HasColumnName("ID_Demanda");
            b.Property(x => x.UsuarioIdInterno).HasColumnName("ID_Usuario");
            b.Property(x => x.StatusAnterior).HasColumnName("SG_Status_Anterior").HasMaxLength(40);
            b.Property(x => x.StatusNovo).HasColumnName("SG_Status_Novo").HasMaxLength(40);
            b.Property(x => x.Comentario).HasColumnName("DS_Comentario").HasMaxLength(2000);
            b.Property(x => x.TipoEvento).HasColumnName("SG_Tipo_Evento").HasMaxLength(40);
            b.Property(x => x.EventoEm).HasColumnName("DT_Evento");
            b.HasOne(x => x.Demanda).WithMany(x => x.Historico).HasForeignKey(x => x.DemandaIdInterno).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioIdInterno).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DecisaoRegistro>(b =>
        {
            b.ToTable("Decisao_Aprovacao");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Decisao").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Decisao");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Decisao_Aprovacao_CD_Decisao");
            b.Property(x => x.DemandaIdInterno).HasColumnName("ID_Demanda");
            b.Property(x => x.UsuarioIdInterno).HasColumnName("ID_Usuario");
            b.Property(x => x.Decisao).HasColumnName("SG_Decisao").HasMaxLength(40);
            b.Property(x => x.Motivo).HasColumnName("DS_Motivo").HasMaxLength(2000);
            b.Property(x => x.DecididaEm).HasColumnName("DT_Decisao");
            b.HasOne(x => x.Demanda).WithMany(x => x.Decisoes).HasForeignKey(x => x.DemandaIdInterno).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioIdInterno).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ObraRegistro>(b =>
        {
            b.ToTable("Obra");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Obra").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Obra");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Obra_CD_Obra");
            b.Property(x => x.Nome).HasColumnName("NM_Obra").HasMaxLength(200);
            b.Property(x => x.Local).HasColumnName("DS_Local").HasMaxLength(200);
            b.Property(x => x.Descricao).HasColumnName("DS_Descricao").HasMaxLength(2000);
            b.Property(x => x.InicioPrevisto).HasColumnName("DT_Inicio_Previsto");
            b.Property(x => x.TerminoPrevisto).HasColumnName("DT_Termino_Previsto");
            b.Property(x => x.EmpresaExecutora).HasColumnName("NM_Empresa_Executora").HasMaxLength(200);
            b.Property(x => x.Responsavel).HasColumnName("NM_Responsavel").HasMaxLength(200);
            b.Property(x => x.Contato).HasColumnName("DS_Contato").HasMaxLength(320);
            b.Property(x => x.Etapa).HasColumnName("SG_Etapa").HasMaxLength(40);
        });

        modelBuilder.Entity<DocumentoObraRegistro>(b =>
        {
            b.ToTable("Obra_Documento");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Obra_Documento").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Obra_Documento");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Obra_Documento_CD_Obra_Documento");
            b.Property(x => x.ObraIdInterno).HasColumnName("ID_Obra");
            b.Property(x => x.Nome).HasColumnName("NM_Documento").HasMaxLength(120);
            b.Property(x => x.Situacao).HasColumnName("SG_Situacao").HasMaxLength(20);
            b.Property(x => x.Ordem).HasColumnName("NR_Ordem");
            b.HasOne(x => x.Obra).WithMany(x => x.Documentos).HasForeignKey(x => x.ObraIdInterno).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NotificacaoRegistro>(b =>
        {
            b.ToTable("Notificacao");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Notificacao").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Notificacao");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Notificacao_CD_Notificacao");
            b.Property(x => x.DemandaIdInterno).HasColumnName("ID_Demanda");
            b.Property(x => x.UsuarioIdInterno).HasColumnName("ID_Usuario");
            b.Property(x => x.Texto).HasColumnName("DS_Texto").HasMaxLength(500);
            b.Property(x => x.Leitura).HasColumnName("SG_Leitura").HasMaxLength(20);
            b.Property(x => x.CriadaEm).HasColumnName("DT_Criacao");
            b.HasOne(x => x.Demanda).WithMany().HasForeignKey(x => x.DemandaIdInterno).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioIdInterno).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InscricaoPushRegistro>(b =>
        {
            b.ToTable("Inscricao_Push");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Inscricao_Push").UseIdentityColumn();
            b.Property(x => x.Id).HasColumnName("CD_Inscricao_Push");
            b.HasIndex(x => x.Id).IsUnique().HasDatabaseName("UK_Inscricao_Push_CD");
            b.Property(x => x.UsuarioIdInterno).HasColumnName("ID_Usuario");
            b.Property(x => x.Endpoint).HasColumnName("DS_Endpoint").HasMaxLength(2000);
            b.Property(x => x.EndpointHash).HasColumnName("DS_Endpoint_Hash").HasMaxLength(64).IsFixedLength();
            b.HasIndex(x => x.EndpointHash).IsUnique().HasDatabaseName("UK_Inscricao_Push_Endpoint");
            b.Property(x => x.ChaveP256dh).HasColumnName("DS_Chave_P256dh").HasMaxLength(200);
            b.Property(x => x.SegredoAuth).HasColumnName("DS_Segredo_Auth").HasMaxLength(200);
            b.Property(x => x.CriadaEm).HasColumnName("DT_Criacao");
            b.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioIdInterno).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EtapaCadeiaRegistro>(b =>
        {
            b.ToTable("Etapa_Cadeia");
            b.HasKey(x => x.IdInterno);
            b.Property(x => x.IdInterno).HasColumnName("ID_Etapa_Cadeia").UseIdentityColumn();
            b.Property(x => x.SubcategoriaIdInterno).HasColumnName("ID_Subcategoria");
            b.Property(x => x.Codigo).HasColumnName("SG_Etapa").HasMaxLength(40);
            b.HasIndex(x => new { x.SubcategoriaIdInterno, x.Codigo }).IsUnique().HasDatabaseName("UK_Etapa_Cadeia_Tipo_Etapa");
            b.HasOne(x => x.Subcategoria).WithMany().HasForeignKey(x => x.SubcategoriaIdInterno).OnDelete(DeleteBehavior.Cascade);
            b.Property(x => x.Nome).HasColumnName("NM_Etapa").HasMaxLength(80);
            b.Property(x => x.Ordem).HasColumnName("NR_Ordem");
            b.Property(x => x.Automatica).HasColumnName("FL_Automatica");
            b.Property(x => x.Campos).HasColumnName("DS_Campos").HasMaxLength(200);
        });
    }
}
