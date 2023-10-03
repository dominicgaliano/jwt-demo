const { verifyToken } = require("../util/auth");
const {
  getPostsController,
  createPostController,
} = require("../controllers/posts");

const express = require("express");
const router = express.Router();

router.get("/", verifyToken, getPostsController);

router.post("/", verifyToken, createPostController);

module.exports = router;
