import jwt from "jsonwebtoken";

const generateToken = (userId, res) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // 🚨 LOCALHOST-SAFE COOKIE CONFIG
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",   // ✅ MUST be lax for localhost
    secure: false,    // ✅ MUST be false on http
    path: "/",        // ✅ ensure global availability
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export default generateToken;
