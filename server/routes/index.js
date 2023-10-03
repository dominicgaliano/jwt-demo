const { verifyToken } = require("../util/auth");
const { getPosts, createPost } = require("../util/posts");
const { getUserById } = require("../util/users");
const createError = require("http-errors");

const express = require("express");
const router = express.Router();

router.get("/posts", verifyToken, async (req, res) => {
  // fetch posts from server
  let posts;
  try {
    posts = await getPosts();
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while fetching posts",
    });
  }

  res.status(200).json(posts);
});

router.post("/posts", verifyToken, async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const user = await getUserById(user_id);
    if (!user) {
      throw createError(500, "User not found");
    }

    const content = req.body.content;
    if (!content) {
      throw createError(400, "No post content found");
    }

    const post = await createPost(user, content);

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
