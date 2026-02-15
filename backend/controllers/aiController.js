export const aiChat = async (req, res) => {
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ reply: "Empty prompt" });
  }

  return res.json({
    reply: `AI placeholder response for: "${message}"`,
  });
};
