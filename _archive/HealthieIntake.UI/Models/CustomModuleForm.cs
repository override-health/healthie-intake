namespace HealthieIntake.UI.Models;

public class CustomModuleForm
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<CustomModule> CustomModules { get; set; } = new();
}

public class CustomModule
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string ModType { get; set; } = string.Empty;
    public bool Required { get; set; }
    public List<string>? Options { get; set; }
}
