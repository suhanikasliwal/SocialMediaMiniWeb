import { Post } from "../models/postModel.js";
import TryCatch from "../utils/Trycatch.js";
import getDataUrl from "../utils/urlGenrator.js";
import cloudinary from "cloudinary";
import { generateCaptionAI } from "../utils/aiClient.js";

/**
 * CREATE NEW POST
 * AI caption enhancement is optional
 */
export const newPost = TryCatch(async (req, res) => {
  let { caption, useAI } = req.body;

  // owner id (WAS MISSING EARLIER)
  const ownerId = req.user._id;

  // DEBUG – remove later
  console.log("RAW useAI:", useAI, typeof useAI);

  // FormData sends strings → normalize
  const isAIEnabled = useAI === "true" || useAI === true;

  // AI caption enhancement
  if (isAIEnabled && caption) {
    console.log("Calling AI with:", caption);
    caption = await generateCaptionAI(caption);
    console.log("AI returned:", caption);
  }

  const file = req.file;
  const fileUrl = getDataUrl(file);

  let option;
  const type = req.query.type;

  if (type === "reel") {
    option = { resource_type: "video" };
  } else {
    option = {};
  }

  const myCloud = await cloudinary.v2.uploader.upload(
    fileUrl.content,
    option
  );

  const post = await Post.create({
    caption,
    post: {
      id: myCloud.public_id,
      url: myCloud.secure_url,
    },
    owner: ownerId,
    type,
  });

  res.status(201).json({
    message: "Post created",
    post,
  });
});

/**
 * DELETE POST
 */
export const deletePost = TryCatch(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({ message: "No post with this id" });

  if (post.owner.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Unauthorized" });

  await cloudinary.v2.uploader.destroy(post.post.id);
  await post.deleteOne();

  res.json({ message: "Post Deleted" });
});

/**
 * GET ALL POSTS & REELS
 */
export const getAllPosts = TryCatch(async (req, res) => {
  const posts = await Post.find({ type: "post" })
    .sort({ createdAt: -1 })
    .populate("owner", "-password")
    .populate({
      path: "comments.user",
      select: "-password",
    });

  const reels = await Post.find({ type: "reel" })
    .sort({ createdAt: -1 })
    .populate("owner", "-password")
    .populate({
      path: "comments.user",
      select: "-password",
    });

  res.json({ posts, reels });
});

/**
 * LIKE / UNLIKE POST
 */
export const likeUnlikePost = TryCatch(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({ message: "No Post with this id" });

  if (post.likes.includes(req.user._id)) {
    post.likes.pull(req.user._id);
    await post.save();
    res.json({ message: "Post Unlike" });
  } else {
    post.likes.push(req.user._id);
    await post.save();
    res.json({ message: "Post liked" });
  }
});

/**
 * COMMENT ON POST
 */
export const commentonPost = TryCatch(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({ message: "No Post with this id" });

  post.comments.push({
    user: req.user._id,
    name: req.user.name,
    comment: req.body.comment,
  });

  await post.save();

  res.json({ message: "Comment Added" });
});

/**
 * DELETE COMMENT
 */
export const deleteComment = TryCatch(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({ message: "No Post with this id" });

  if (!req.query.commentId)
    return res.status(404).json({ message: "Please give comment id" });

  const commentIndex = post.comments.findIndex(
    (item) => item._id.toString() === req.query.commentId.toString()
  );

  if (commentIndex === -1)
    return res.status(400).json({ message: "Comment not found" });

  const comment = post.comments[commentIndex];

  if (
    post.owner.toString() === req.user._id.toString() ||
    comment.user.toString() === req.user._id.toString()
  ) {
    post.comments.splice(commentIndex, 1);
    await post.save();
    return res.json({ message: "Comment deleted" });
  }

  return res
    .status(400)
    .json({ message: "You are not allowed to delete this comment" });
});

/**
 * EDIT POST CAPTION
 */
export const editCaption = TryCatch(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({ message: "No Post with this id" });

  if (post.owner.toString() !== req.user._id.toString())
    return res
      .status(403)
      .json({ message: "You are not owner of this post" });

  post.caption = req.body.caption;
  await post.save();

  res.json({ message: "post updated" });
});
