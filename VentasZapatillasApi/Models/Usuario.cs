namespace ventasZapatiilasAPI.Models
{
    public class Usuario
    {
        public int Id { get; set; }
        public required string Nombre { get; set; }
        public  required string Email { get; set; }
        public required string Password { get; set; }


    }
}
