using Microsoft.EntityFrameworkCore;
using ventasZapatiilasAPI.Models;

namespace ventasZapatiilasAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Productos> Productos { get; set; }
        
    }
}
