using System.Security.Cryptography;
using System.Text;
using Gl.Demandas.Application;

namespace Gl.Demandas.Application.Tests;

public class WhatsAppWebhookTests
{
    private const string Corpo = """
        {
          "object": "whatsapp_business_account",
          "entry": [{
            "changes": [{
              "field": "messages",
              "value": {
                "messaging_product": "whatsapp",
                "metadata": { "phone_number_id": "256812950851509" },
                "contacts": [{ "profile": { "name": "Maria" }, "wa_id": "5521994684864" }],
                "messages": [{
                  "from": "5521994684864",
                  "id": "wamid.abc",
                  "timestamp": "1760000000",
                  "type": "text",
                  "text": { "body": "Pode vir amanhã" }
                }],
                "statuses": [{
                  "id": "wamid.xyz",
                  "status": "delivered",
                  "timestamp": "1760000001",
                  "recipient_id": "5521994684864"
                }]
              }
            }]
          }]
        }
        """;

    [Fact]
    public void Verificacao_devolve_o_desafio_quando_o_token_confere()
    {
        Assert.Equal("12345", LeituraWebhookWhatsApp.Desafio("subscribe", "segredo", "12345", "segredo"));
        Assert.Null(LeituraWebhookWhatsApp.Desafio("subscribe", "outro", "12345", "segredo"));
        Assert.Null(LeituraWebhookWhatsApp.Desafio("unsubscribe", "segredo", "12345", "segredo"));
    }

    [Fact]
    public void Leitura_separa_mensagem_e_status()
    {
        var eventos = LeituraWebhookWhatsApp.Ler(Corpo);

        Assert.Equal(2, eventos.Count);
        var mensagem = Assert.Single(eventos, evento => evento.Tipo == "mensagem");
        Assert.Equal("wamid.abc", mensagem.IdMensagem);
        Assert.Equal("5521994684864", mensagem.Telefone);
        Assert.Equal("Maria", mensagem.Nome);
        Assert.Equal("Pode vir amanhã", mensagem.Texto);
        Assert.Equal("256812950851509", mensagem.PhoneNumberId);

        var status = Assert.Single(eventos, evento => evento.Tipo == "status");
        Assert.Equal("wamid.xyz", status.IdMensagem);
        Assert.Equal("delivered", status.Status);
        Assert.Equal("5521994684864", status.Telefone);
    }

    [Fact]
    public void Assinatura_aceita_o_hmac_do_corpo()
    {
        const string segredo = "app-secret";
        var hash = Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(segredo), Encoding.UTF8.GetBytes(Corpo))).ToLowerInvariant();

        Assert.True(AssinaturaWhatsApp.Confere("sha256=" + hash, Corpo, segredo));
        Assert.False(AssinaturaWhatsApp.Confere("sha256=" + hash, Corpo + " ", segredo));
        Assert.False(AssinaturaWhatsApp.Confere(null, Corpo, segredo));
    }

    [Fact]
    public async Task Receber_entrega_mensagem_e_status_para_guardar()
    {
        var memoria = new EventosMemoria();
        await new WebhookWhatsAppAplicacao(memoria).Receber(Corpo, CancellationToken.None);

        Assert.Equal(2, memoria.Guardados.Count);
        Assert.Contains(memoria.Guardados, evento => evento.Texto == "Pode vir amanhã");
        Assert.Contains(memoria.Guardados, evento => evento.Status == "delivered");
    }

    private sealed class EventosMemoria : IEventosWhatsApp
    {
        public List<EventoWhatsAppRecebido> Guardados { get; } = [];

        public Task Guardar(IReadOnlyList<EventoWhatsAppRecebido> eventos, CancellationToken ct)
        {
            Guardados.AddRange(eventos);
            return Task.CompletedTask;
        }
    }
}
