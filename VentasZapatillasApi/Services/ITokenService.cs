using ventasZapatiilasAPI.Models;

namespace ventasZapatiilasAPI.Services
{
   
    public interface ITokenService
    {
       
        string CrearToken(Usuario usuario);
    }
}
