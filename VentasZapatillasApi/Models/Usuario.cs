using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ventasZapatiilasAPI.Models
{
    [Table("Usuarios")]
    public class Usuario
    {
        [Key]
        [Column(TypeName = "Varchar (10)")]
        public string id_usuario{ get; set; } = string.Empty;

        [Column(TypeName = "Varchar (80)")]
        public string nombre { get; set; } = string.Empty;

        [Column(TypeName = "varbinary (220)")]
        public string correo { get; set; } = string.Empty;

        [Column(TypeName ="varbinary(256)")] 
        public string password_hash { get; set; } = string.Empty;

        [Column(TypeName ="varchar(15)")]
        public string tipo_usuario { get; set; } = "Cliente";
    }
}
