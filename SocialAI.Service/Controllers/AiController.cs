using Microsoft.AspNetCore.Mvc;
using SocialAI.Service.Models;
using SocialAI.Service.Services;

namespace SocialAI.Service.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly IAiService _aiService;

    public AiController(IAiService aiService)
    {
        _aiService = aiService;
    }

    // =========================================================
    // EXISTING ENDPOINT (UNCHANGED)
    // Purpose: Generic AI generation (already in use)
    // =========================================================
    [HttpPost("generate-post")]
    public async Task<ActionResult<AiResponse>> GeneratePost(AiRequest request)
    {
        var result = await _aiService.GeneratePostAsync(request.Prompt);

        return Ok(new AiResponse
        {
            Text = result
        });
    }

    // =========================================================
    // EXISTING ENDPOINT (UNCHANGED)
    // Purpose: AI Copilot / Chat (high load, keep isolated)
    // =========================================================
    [HttpPost("chat")]
    public async Task<ActionResult<AiChatResponse>> Chat(
        [FromBody] AiChatRequest request
    )
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("Message is required");
        }

        var reply = await _aiService.ChatAsync(request.Message);

        return Ok(new AiChatResponse
        {
            Reply = reply
        });
    }

    // =========================================================
    // NEW ENDPOINT (SAFE, ON-DEMAND, NON-BLOCKING)
    // Purpose: Enhance an existing post draft
    // =========================================================
    [HttpPost("enhance-post")]
    public async Task<ActionResult<AiEnhanceResponse>> EnhancePost(
        [FromBody] AiEnhanceRequest request
    )
    {
        // Guardrail 1: Input validation
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("Content is required");
        }

        // Guardrail 2: Hard cap input length
        var content =
            request.Content.Length > 500
                ? request.Content.Substring(0, 500)
                : request.Content;

        // -----------------------------------------------------
        // CORRECT LOGIC: Success is based on AI output quality,
        // NOT on exceptions
        // -----------------------------------------------------
        var enhancedText = await _aiService.EnhancePostAsync(content);

        if (string.IsNullOrWhiteSpace(enhancedText))
        {
            return Ok(new AiEnhanceResponse
            {
                EnhancedContent = content,
                Success = false
            });
        }

        return Ok(new AiEnhanceResponse
        {
            EnhancedContent = enhancedText,
            Success = true
        });
    }
}
