using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace SocialAI.Service.Services;

public class AiService : IAiService
{
    private readonly IHttpClientFactory _httpClientFactory;

    public AiService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<string> GeneratePostAsync(string prompt)
    {
        return await CallOpenAIAsync(
            $"Improve this social media caption in an engaging way:\n{prompt}"
        );
    }

    public async Task<string> ChatAsync(string message)
    {
        return await CallOpenAIAsync(
            $"You are a helpful social media AI copilot.\nUser: {message}"
        );
    }

   private async Task<string> CallOpenAIAsync(string input)
{
    var apiKey =
        Environment.GetEnvironmentVariable("OPENAI_API_KEY")
        ?? throw new Exception("OPENAI_API_KEY is not set");

    var client = _httpClientFactory.CreateClient();

    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", apiKey);

    client.DefaultRequestHeaders.Accept.Add(
        new MediaTypeWithQualityHeaderValue("application/json")
    );

    var requestBody = new
{
    model = "gpt-4o-mini",
    input = input
};


    var content = new StringContent(
        JsonSerializer.Serialize(requestBody),
        Encoding.UTF8,
        "application/json"
    );

    HttpResponseMessage response;

    try
    {
        response = await client.PostAsync(
            "https://api.openai.com/v1/responses",
            content
        );
    }
    catch
    {
        return "AI service is temporarily unreachable.";
    }

    // 🚦 RATE LIMIT HANDLING
   if ((int)response.StatusCode == 429)
{
    await Task.Delay(2000); // wait 2 seconds
    return "AI is currently busy. Please try again in a few seconds.";
}


    // ❌ OTHER ERRORS
    if (!response.IsSuccessStatusCode)
    {
        return $"AI error ({(int)response.StatusCode}). Please try later.";
    }

    var json = await response.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(json);

    return doc.RootElement
        .GetProperty("output")[0]
        .GetProperty("content")[0]
        .GetProperty("text")
        .GetString()!;
}

}
