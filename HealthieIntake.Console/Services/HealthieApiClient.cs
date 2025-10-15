using GraphQL;
using GraphQL.Client.Http;
using GraphQL.Client.Serializer.SystemTextJson;
using HealthieIntake.Console.Models;
using System.Text.Json;

namespace HealthieIntake.Console.Services;

public class HealthieApiClient
{
    private readonly GraphQLHttpClient _client;

    public HealthieApiClient(string apiUrl, string apiKey)
    {
        _client = new GraphQLHttpClient(apiUrl, new SystemTextJsonSerializer());
        _client.HttpClient.DefaultRequestHeaders.Add("Authorization", $"Basic {apiKey}");
        _client.HttpClient.DefaultRequestHeaders.Add("AuthorizationSource", "API");
    }

    public async Task<Patient?> GetPatientAsync(string patientId)
    {
        var query = new GraphQLRequest
        {
            Query = @"
                query($id: ID!) {
                    user(id: $id) {
                        id
                        email
                        first_name
                        last_name
                    }
                }
            ",
            Variables = new { id = patientId }
        };

        var response = await _client.SendQueryAsync<dynamic>(query);

        if (response.Errors != null && response.Errors.Length > 0)
        {
            throw new Exception($"Error fetching patient: {response.Errors[0].Message}");
        }

        var userData = response.Data.GetProperty("user");
        return new Patient
        {
            Id = userData.GetProperty("id").GetString() ?? "",
            Email = userData.GetProperty("email").GetString() ?? "",
            FirstName = userData.GetProperty("first_name").GetString() ?? "",
            LastName = userData.GetProperty("last_name").GetString() ?? ""
        };
    }

    public async Task<CustomModuleForm?> GetCustomFormAsync(string formId)
    {
        var query = new GraphQLRequest
        {
            Query = @"
                query($id: ID!) {
                    customModuleForm(id: $id) {
                        id
                        name
                        custom_modules {
                            id
                            label
                            mod_type
                            required
                        }
                    }
                }
            ",
            Variables = new { id = formId }
        };

        var response = await _client.SendQueryAsync<dynamic>(query);

        if (response.Errors != null && response.Errors.Length > 0)
        {
            throw new Exception($"Error fetching form: {response.Errors[0].Message}");
        }

        var formData = response.Data.GetProperty("customModuleForm");
        var modules = formData.GetProperty("custom_modules");

        var customModules = new List<CustomModule>();
        foreach (var module in modules.EnumerateArray())
        {
            customModules.Add(new CustomModule
            {
                Id = module.GetProperty("id").GetString() ?? "",
                Label = module.GetProperty("label").GetString() ?? "",
                ModType = module.GetProperty("mod_type").GetString() ?? "",
                Required = module.GetProperty("required").GetBoolean()
            });
        }

        return new CustomModuleForm
        {
            Id = formData.GetProperty("id").GetString() ?? "",
            Name = formData.GetProperty("name").GetString() ?? "",
            CustomModules = customModules
        };
    }

    public async Task<string> CreateFormAnswerGroupAsync(FormAnswerGroupInput input)
    {
        // Create the form answer group with finished = true
        var mutation = new GraphQLRequest
        {
            Query = @"
                mutation createFormAnswerGroup($input: createFormAnswerGroupInput!) {
                    createFormAnswerGroup(input: $input) {
                        form_answer_group {
                            id
                            finished
                        }
                        messages {
                            field
                            message
                        }
                    }
                }
            ",
            Variables = new
            {
                input = new
                {
                    custom_module_form_id = input.CustomModuleFormId,
                    user_id = input.UserId,
                    finished = true,
                    form_answers = input.FormAnswers.Select(a => new
                    {
                        custom_module_id = a.CustomModuleId,
                        answer = a.Answer
                    }).ToArray()
                }
            }
        };

        var response = await _client.SendMutationAsync<dynamic>(mutation);

        if (response.Errors != null && response.Errors.Length > 0)
        {
            var errorMsg = string.Join("; ", response.Errors.Select(e => e.Message));
            throw new Exception($"GraphQL errors: {errorMsg}");
        }

        // Debug: Print the raw response
        System.Console.WriteLine($"DEBUG: Response data: {response.Data}");

        var result = response.Data.GetProperty("createFormAnswerGroup");

        // Check for validation messages
        if (result.TryGetProperty("messages", out JsonElement messages) &&
            messages.ValueKind == JsonValueKind.Array &&
            messages.GetArrayLength() > 0)
        {
            var errorMessages = new List<string>();
            foreach (var msg in messages.EnumerateArray())
            {
                errorMessages.Add($"{msg.GetProperty("field")}: {msg.GetProperty("message")}");
            }
            throw new Exception($"Validation errors: {string.Join(", ", errorMessages)}");
        }

        if (result.TryGetProperty("form_answer_group", out JsonElement formAnswerGroup) &&
            formAnswerGroup.ValueKind != JsonValueKind.Null)
        {
            var formAnswerGroupId = formAnswerGroup.GetProperty("id").GetString() ?? "";
            var isFinished = formAnswerGroup.GetProperty("finished").GetBoolean();

            System.Console.WriteLine($"DEBUG: Form created with ID {formAnswerGroupId}, finished={isFinished}");

            return formAnswerGroupId;
        }

        throw new Exception("Form submission failed - no form_answer_group returned");
    }

    public async Task<dynamic> GetFormAnswerGroupDetailsAsync(string formAnswerGroupId)
    {
        var query = new GraphQLRequest
        {
            Query = @"
                query($id: ID!) {
                    formAnswerGroup(id: $id) {
                        id
                        finished
                        created_at
                        form_answers {
                            id
                            answer
                            displayed_answer
                            custom_module {
                                id
                                label
                                mod_type
                            }
                        }
                    }
                }
            ",
            Variables = new { id = formAnswerGroupId }
        };

        var response = await _client.SendQueryAsync<dynamic>(query);

        if (response.Errors != null && response.Errors.Length > 0)
        {
            throw new Exception($"Error fetching form answer group details: {response.Errors[0].Message}");
        }

        return response.Data;
    }

    public async Task<List<string>> GetFormAnswerGroupsForPatientAsync(string patientId)
    {
        var query = new GraphQLRequest
        {
            Query = @"
                query($userId: String) {
                    formAnswerGroups(user_id: $userId) {
                        id
                        custom_module_form {
                            id
                            name
                        }
                        created_at
                    }
                }
            ",
            Variables = new { userId = patientId }
        };

        var response = await _client.SendQueryAsync<dynamic>(query);

        if (response.Errors != null && response.Errors.Length > 0)
        {
            throw new Exception($"Error fetching form answer groups: {response.Errors[0].Message}");
        }

        var formAnswerGroups = response.Data.GetProperty("formAnswerGroups");
        var ids = new List<string>();

        System.Console.WriteLine($"\nFound {formAnswerGroups.GetArrayLength()} form answer group(s) for patient {patientId}:");
        foreach (var group in formAnswerGroups.EnumerateArray())
        {
            var id = group.GetProperty("id").GetString() ?? "";
            var formName = group.GetProperty("custom_module_form").GetProperty("name").GetString() ?? "";
            var createdAt = group.GetProperty("created_at").GetString() ?? "";
            ids.Add(id);
            System.Console.WriteLine($"  - ID: {id}, Form: {formName}, Created: {createdAt}");
        }

        return ids;
    }

    public async Task<bool> DeleteFormAnswerGroupAsync(string formAnswerGroupId)
    {
        var mutation = new GraphQLRequest
        {
            Query = @"
                mutation deleteFormAnswerGroup($input: deleteFormAnswerGroupInput!) {
                    deleteFormAnswerGroup(input: $input) {
                        messages {
                            field
                            message
                        }
                    }
                }
            ",
            Variables = new
            {
                input = new
                {
                    id = formAnswerGroupId
                }
            }
        };

        var response = await _client.SendMutationAsync<dynamic>(mutation);

        if (response.Errors != null && response.Errors.Length > 0)
        {
            var errorMsg = string.Join("; ", response.Errors.Select(e => e.Message));
            throw new Exception($"GraphQL errors: {errorMsg}");
        }

        return true;
    }
}
