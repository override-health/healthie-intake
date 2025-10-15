using HealthieIntake.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Add CORS for Blazor app
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowBlazorApp", policy =>
    {
        policy.WithOrigins("http://localhost:5000", "https://localhost:5001", "http://localhost:5173", "http://localhost:5174", "http://localhost:5046", "https://localhost:5046")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register Healthie API Client
var healthieConfig = builder.Configuration.GetSection("Healthie");
builder.Services.AddSingleton(sp => new HealthieApiClient(
    healthieConfig["ApiUrl"] ?? throw new Exception("Healthie:ApiUrl not configured"),
    healthieConfig["ApiKey"] ?? throw new Exception("Healthie:ApiKey not configured")
));

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowBlazorApp");
app.MapControllers();

app.Run();
