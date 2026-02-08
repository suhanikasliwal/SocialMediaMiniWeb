namespace SocialAI.Service.Infrastructure
{
    /// <summary>
    /// Runtime-only demo auth state.
    /// - App-scoped (static)
    /// - Resets on application restart
    /// - NEVER persisted
    /// </summary>
    public static class DemoAuthState
    {
        public static bool BypassAuth { get; set; }
    }
}
