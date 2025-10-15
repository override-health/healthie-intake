using Microsoft.AspNetCore.Mvc;
using HealthieIntake.Api.Models;
using HealthieIntake.Api.Services;

namespace HealthieIntake.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthieController : ControllerBase
{
    private readonly HealthieApiClient _healthieClient;
    private readonly ILogger<HealthieController> _logger;

    public HealthieController(HealthieApiClient healthieClient, ILogger<HealthieController> logger)
    {
        _healthieClient = healthieClient;
        _logger = logger;
    }

    [HttpGet("patients/{patientId}")]
    public async Task<ActionResult<Patient>> GetPatient(string patientId)
    {
        try
        {
            var patient = await _healthieClient.GetPatientAsync(patientId);
            return Ok(patient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching patient {PatientId}", patientId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("forms/{formId}")]
    public async Task<ActionResult<CustomModuleForm>> GetForm(string formId)
    {
        try
        {
            var form = await _healthieClient.GetCustomFormAsync(formId);
            return Ok(form);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching form {FormId}", formId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("forms/submit")]
    public async Task<ActionResult<object>> SubmitForm([FromBody] FormAnswerGroupInput input)
    {
        try
        {
            var formAnswerGroupId = await _healthieClient.CreateFormAnswerGroupAsync(input);
            return Ok(new { formAnswerGroupId, success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting form");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("patients/{patientId}/forms")]
    public async Task<ActionResult<List<string>>> GetPatientForms(string patientId)
    {
        try
        {
            var forms = await _healthieClient.GetFormAnswerGroupsForPatientAsync(patientId);
            return Ok(forms);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching forms for patient {PatientId}", patientId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("forms/details/{formAnswerGroupId}")]
    public async Task<ActionResult<object>> GetFormDetails(string formAnswerGroupId)
    {
        try
        {
            var details = await _healthieClient.GetFormAnswerGroupDetailsAsync(formAnswerGroupId);
            return Ok(details);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching form details {FormAnswerGroupId}", formAnswerGroupId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("forms/{formAnswerGroupId}")]
    public async Task<ActionResult> DeleteForm(string formAnswerGroupId)
    {
        try
        {
            await _healthieClient.DeleteFormAnswerGroupAsync(formAnswerGroupId);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting form {FormAnswerGroupId}", formAnswerGroupId);
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
