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

    // =====================================================
    // EXISTING: Generic AI generation (UNCHANGED BEHAVIOR)
    // =====================================================
    public async Task<string> GeneratePostAsync(string prompt)
    {
        var result = await CallOpenAIAsync(
            $"Improve this social media caption in an engaging way:\n{prompt}",
            maxTokens: 200
        );

        // Preserve legacy behavior
        return result ?? "AI service is temporarily unavailable.";
    }

    // =====================================================
    // EXISTING: AI Copilot / Chat (UNCHANGED BEHAVIOR)
    // =====================================================
    public async Task<string> ChatAsync(string message)
    {
        var result = await CallOpenAIAsync(
            $"You are a helpful social media AI copilot.\nUser: {message}",
            maxTokens: 300
        );

        // Preserve legacy behavior
        return result ?? "AI is currently busy. Please try again shortly.";
    }

    // =====================================================
    // NEW: On-demand Post Enhancement (SEMANTICALLY CORRECT)
    // =====================================================
    public async Task<string?> EnhancePostAsync(string content)
    {
        // Hard guardrail: prevent payload abuse
        var safeContent =
            content.Length > 500
                ? content.Substring(0, 500)
                : content;

        var prompt = $"""
Rewrite the following social media post to be clearer, concise, and engaging.
Do not change the meaning.
Optionally add 3 to 5 relevant hashtags at the end.

Post:
"{safeContent}"
""";

        // IMPORTANT:
        // - Return AI output when successful
        // - Return NULL when AI is busy / degraded
        // - Do NOT return fallback strings here
        return await CallOpenAIAsync(prompt, maxTokens: 150);
    }

    // =====================================================
    // CORE OPENAI CALL (HARDENED, FAIL-OPEN, SIGNAL-ONLY)
    // =====================================================
    private async Task<string?> CallOpenAIAsync(string input, int maxTokens)
    {
        var apiKey =
            Environment.GetEnvironmentVariable("OPENAI_API_KEY")
            ?? throw new Exception("OPENAI_API_KEY is not set");

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(8);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        client.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json")
        );

        var requestBody = new
        {
            model = "gpt-4o-mini",
            input = input,
            max_output_tokens = maxTokens
        };

        var httpContent = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json"
        );

        try
        {
            var response = await client.PostAsync(
                "https://api.openai.com/v1/responses",
                httpContent
            );

            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            return doc.RootElement
                .GetProperty("output")[0]
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString();
        }
        catch
        {
            // Absolute fail-open guarantee
            return null;
        }
    }
}
