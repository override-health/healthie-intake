using HealthieIntake.Console.Services;
using HealthieIntake.Console.Models;
using Microsoft.Extensions.Configuration;

// Load configuration
var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .Build();

var apiKey = configuration["Healthie:ApiKey"] ?? throw new Exception("API Key not found");
var apiUrl = configuration["Healthie:ApiUrl"] ?? throw new Exception("API URL not found");

Console.WriteLine("Healthie Patient Intake Form - POC");
Console.WriteLine("===================================");
Console.WriteLine($"Environment: {configuration["Healthie:Environment"]}");
Console.WriteLine($"API URL: {apiUrl}");
Console.WriteLine();

// Create API client
var client = new HealthieApiClient(apiUrl, apiKey);

try
{
    // Delete all test forms
    var patientId = "3642270";

    Console.WriteLine("Deleting all test form submissions...");
    Console.WriteLine("======================================");
    var existingForms = await client.GetFormAnswerGroupsForPatientAsync(patientId);
    Console.WriteLine();

    if (existingForms.Any())
    {
        foreach (var existingFormId in existingForms)
        {
            try
            {
                await client.DeleteFormAnswerGroupAsync(existingFormId);
                Console.WriteLine($"✅ Deleted Form Answer Group ID: {existingFormId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️  Could not delete {existingFormId}: {ex.Message}");
            }
        }
        Console.WriteLine();
        Console.WriteLine($"✅ Cleanup complete! Deleted {existingForms.Count} form(s).");
    }
    else
    {
        Console.WriteLine("No forms found to delete.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"   Details: {ex.InnerException.Message}");
    }
}

    // Exit after displaying
    /*
    if (existingForms.Any())
    {
        Console.WriteLine("Deleting all existing test form submissions...");
        foreach (var existingFormId in existingForms)
        {
            try
            {
                await client.DeleteFormAnswerGroupAsync(existingFormId);
                Console.WriteLine($"✅ Deleted Form Answer Group ID: {existingFormId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️  Could not delete {existingFormId}: {ex.Message}");
            }
        }
        Console.WriteLine();
    }

    Console.WriteLine("Step 1: Fetching patient information...");
    var patient = await client.GetPatientAsync(patientId);

    if (patient != null)
    {
        Console.WriteLine($"✅ Patient: {patient.FirstName} {patient.LastName} ({patient.Email})");
        Console.WriteLine();
    }

    Console.WriteLine("Step 2: Fetching custom form structure...");
    var form = await client.GetCustomFormAsync(formId);

    if (form != null)
    {
        Console.WriteLine($"✅ Form: {form.Name}");
        Console.WriteLine($"   Total Fields: {form.CustomModules.Count}");
        Console.WriteLine($"   Required Fields: {form.CustomModules.Count(m => m.Required)}");
        Console.WriteLine();
    }

    Console.WriteLine("Step 3: Creating complete form submission...");
    Console.WriteLine("(Filling ALL 50 fields with appropriate test data)");
    Console.WriteLine();

    // Create form answers for ALL fields
    var formAnswers = new List<FormAnswerInput>();

    foreach (var field in form!.CustomModules)
    {
        string answer = field.ModType switch
        {
            "label" => "", // Labels don't need answers
            "read_only" => "", // Read-only fields don't need answers
            "radio" => "2", // Mid-range value for radio scales
            "horizontal_radio" => "No",
            "text" => "Test text input",
            "textarea" => "This is a test textarea response with multiple lines of content.",
            "date" => "1985-05-15",
            "location" => "123 Main St, Anytown, CA 12345",
            "checkbox" => "Option 1,Option 2", // Comma-separated for multiple selections
            "signature" => "Corey Crowley", // Signature as text
            "BMI(in.)" => "5'10\", 180 lbs", // Height and weight format
            _ => "Test answer"
        };

        // Skip labels and read-only fields
        if (field.ModType == "label" || field.ModType == "read_only")
        {
            continue;
        }

        // Provide more specific answers based on the field label
        if (field.Label.Contains("Date of birth"))
        {
            answer = "1985-05-15";
        }
        else if (field.Label.Contains("Referring physician"))
        {
            answer = "Dr. John Smith";
        }
        else if (field.Label.Contains("Primary care physician"))
        {
            answer = "Dr. Jane Doe";
        }
        else if (field.Label.Contains("Occupation"))
        {
            answer = "Software Engineer";
        }
        else if (field.Label.Contains("Emergency contact"))
        {
            answer = "Jane Crowley, Spouse, (555) 123-4567";
        }
        else if (field.Label.Contains("Tell us about your pain"))
        {
            answer = "Lower back pain started 6 months ago. Dull ache that gets worse with sitting. Better with movement and stretching. Tried ibuprofen and heating pad with moderate relief.";
        }
        else if (field.Label.Contains("medical problems and diagnoses"))
        {
            answer = "Hypertension (diagnosed 2020), Seasonal allergies";
        }
        else if (field.Label.Contains("surgeries and dates"))
        {
            answer = "Appendectomy - March 2010";
        }
        else if (field.Label.Contains("current prescribed and over-the-counter medications"))
        {
            answer = "Lisinopril 10mg daily, Ibuprofen 400mg as needed for pain, Multivitamin daily";
        }
        else if (field.Label.Contains("medications have you taken for pain"))
        {
            answer = "Tried Tylenol but didn't provide enough relief. Switched to ibuprofen which works better.";
        }
        else if (field.Label.Contains("medication allergies"))
        {
            answer = "Penicillin - causes rash";
        }
        else if (field.Label.Contains("physical or psychological trauma"))
        {
            answer = "No significant trauma history";
        }
        else if (field.Label.Contains("physically active"))
        {
            answer = "Walk 30 minutes 3x per week, yoga 1x per week";
        }
        else if (field.Label.Contains("top 3 goals"))
        {
            answer = "1. Reduce daily pain to manageable levels\n2. Improve sleep quality\n3. Return to regular exercise routine";
        }
        else if (field.Label.Contains("anything more you would like"))
        {
            answer = "Looking forward to exploring alternative pain management options and improving overall quality of life.";
        }
        else if (field.Label.Contains("Signature"))
        {
            answer = "Corey Crowley";
        }

        formAnswers.Add(new FormAnswerInput
        {
            CustomModuleId = field.Id,
            Answer = answer
        });
    }

    Console.WriteLine($"Prepared answers for {formAnswers.Count} fields (skipped {form.CustomModules.Count - formAnswers.Count} label/read-only fields)");

    var formInput = new FormAnswerGroupInput
    {
        CustomModuleFormId = formId,
        UserId = patientId,
        FormAnswers = formAnswers
    };

    Console.WriteLine("Submitting form...");
    var formAnswerGroupId = await client.CreateFormAnswerGroupAsync(formInput);

    Console.WriteLine($"✅ Form submitted successfully!");
    Console.WriteLine($"   Form Answer Group ID: {formAnswerGroupId}");
    Console.WriteLine();
    Console.WriteLine("🎉 POC Complete! The form submission workflow is working.");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"   Details: {ex.InnerException.Message}");
    }
}
*/
