using System.Security.Cryptography;
using System.Text;

namespace Gl.Demandas.Application;

public static class SenhaDemo
{
    public static string Hash(string senha) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(senha))).ToLowerInvariant();
}
