require("dotenv").config();
const {
  authenticateUser,
  signToken,
  verifyRefreshToken,
  verifyToken,
} = require("./util/auth");
const { getUsers, createUser, getUserById } = require("./util/users");
const express = require("express");
const redisClient = require("./util/redis");
const bcrypt = require("bcrypt");
const morgan = require("morgan");

const PORT = process.env.AUTH_PORT || 4001;

const app = express();
app.use(express.json());
app.use(morgan("tiny"));

redisClient.connect();

app.use((req, res, next) => {
  req.redisClient = redisClient;
  next();
});

app.post("/users", async (req, res) => {
  const { username, password } = req.body;

  // validate input
  if (!username || !password) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Username and password are required.",
    });
  }

  // register user
  try {
    await createUser(username, await bcrypt.hash(password, 10));
  } catch (error) {
    console.log("Error:", error);
    return res.sendStatus(500);
  }

  res.status(200).send();
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // validate input
  if (!username || !password) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Username and password are required.",
    });
  }

  // fetch users from server
  let users;
  try {
    users = await getUsers();
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while authenticating user",
    });
  }

  // authenticate user
  const user = await authenticateUser(username, password, users);
  if (!user) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "Invalid username or password" });
  }

  // create JWT
  try {
    const accessToken = await signToken(user, "access");
    const refreshToken = await signToken(user, "refresh");

    // add refresh token to cache
    await redisClient.set(user.id.toString(), refreshToken);

    res
      .status(200)
      .json({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while generating the JWT.",
    });
  }
});

app.post("/logout", verifyToken, async (req, res) => {
  // remove token from cache
  try {
    await redisClient.del(req.user_id.toString());
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.post("/token", verifyRefreshToken, async (req, res, next) => {
  const user_id = req.userId;
  const user = await getUserById(user_id);

  // send new tokens
  try {
    const accessToken = await signToken(user, "access");
    const refreshToken = await signToken(user, "refresh");

    // add refresh token to cache
    await redisClient.set(user.id.toString(), refreshToken);

    res
      .status(200)
      .json({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while generating the JWT.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Auth server listening on PORT ${PORT}`);
});
