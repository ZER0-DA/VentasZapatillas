namespace ventasZapatiilasAPI.Models
{
    public class RegistrarUsuario
    {
        public  required string nombre { get; set; } = string.Empty;
        public  required string correo { get; set; } = string.Empty;
        public  required string password { get; set; } = string.Empty;
        public  required string tipo_usuario { get; set; } = string.Empty; 
    }
}
