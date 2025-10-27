namespace HealthieIntake.Api.Models;

public class FormAnswerGroupInput
{
    public string CustomModuleFormId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public List<FormAnswerInput> FormAnswers { get; set; } = new();
}

public class FormAnswerInput
{
    public string CustomModuleId { get; set; } = string.Empty;
    public string? Answer { get; set; }
    public string? UserAnswer { get; set; }
}
