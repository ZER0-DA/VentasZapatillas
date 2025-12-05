using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using ventasZapatiilasAPI.Models;
using Microsoft.Extensions.Configuration;

namespace ventasZapatiilasAPI.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;

        public TokenService(IConfiguration config)
        {
            _config = config;
        }

        public string CrearToken(Usuario usuario)
        {
           
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.id_usuario.ToString()),
                new Claim(ClaimTypes.Email, usuario.correo),
                new Claim(ClaimTypes.Role, usuario.tipo_usuario)
            };

            // 2. Obtener y validar la clave secreta y el emisor
            var key = _config["Jwt:Key"]
                ?? throw new InvalidOperationException("La configuración 'Jwt:Key' no está definida en appsettings.json");

            var issuer = _config["Jwt:Issuer"]
                ?? throw new InvalidOperationException("La configuración 'Jwt:Issuer' no está definida en appsettings.json");

            // 3. Crear la llave de seguridad
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

            // 4. Configurar el Token
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7), // Token expira en 7 días
                Issuer = issuer,
                Audience = issuer,
                SigningCredentials = new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}