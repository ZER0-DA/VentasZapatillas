namespace ventasZapatiilasAPI.Models.DTO
{
    public class RegistrarUsuarioDTO
    {
        public  required string Nombre { get; set; } = string.Empty;
        public  required string Correo { get; set; } = string.Empty;
        public  required string Password { get; set; } = string.Empty;
    }
}
