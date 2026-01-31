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

    [HttpPost("generate-post")]
    public async Task<ActionResult<AiResponse>> GeneratePost(AiRequest request)
    {
        var result = await _aiService.GeneratePostAsync(request.Prompt);

        return Ok(new AiResponse
        {
            Text = result
        });
    }
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

}
