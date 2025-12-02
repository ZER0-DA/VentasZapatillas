using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ventasZapatiilasAPI.Models
{
    [Table("Usuarios")]
    public class Usuario
    {

        [Key]
        public int id_usuario { get; set; }

        public required string nombre { get; set; }
        public required string correo { get; set; }

        public required byte[] password_hash { get; set; }

        public DateTime fecha_registro { get; set; }

        public required string tipo_usuario { get; set; }
        public int intentos_fallidos { get; set; }

        public bool estado_bloqueo { get; set; }
    }
}
