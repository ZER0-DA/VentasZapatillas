namespace ventasZapatiilasAPI.Models.DTO
{
    public class LoginDTO
    {
        public required string Correo { get; set; } = string.Empty;
        public required string Password { get; set; } = string.Empty;
    }
}