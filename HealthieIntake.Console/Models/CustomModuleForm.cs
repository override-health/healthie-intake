namespace HealthieIntake.Console.Models;

public class CustomModuleForm
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<CustomModule> CustomModules { get; set; } = new();
}
