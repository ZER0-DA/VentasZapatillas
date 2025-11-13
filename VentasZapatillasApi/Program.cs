using Microsoft.EntityFrameworkCore;
using ventasZapatiilasAPI.Data;
using ventasZapatiilasAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Agregar DbContext con la cadena de conexión
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("CadenaConexion"))
);

builder.Services.AddScoped<UsuarioService>();


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configuración del pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();

app.Run();
