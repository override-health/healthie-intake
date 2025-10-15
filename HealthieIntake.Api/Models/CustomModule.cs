namespace HealthieIntake.Api.Models;

public class CustomModule
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string ModType { get; set; } = string.Empty;
    public bool Required { get; set; }
}
