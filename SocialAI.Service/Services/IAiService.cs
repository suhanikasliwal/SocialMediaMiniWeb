namespace SocialAI.Service.Services;

public interface IAiService
{
    Task<string> GeneratePostAsync(string prompt);

    Task<string> ChatAsync(string message);

    // IMPORTANT: Enhancement can fail gracefully
    Task<string?> EnhancePostAsync(string content);
}
