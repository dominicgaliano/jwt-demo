require("dotenv").config();
const {
  authenticateUser,
  signToken,
  verifyRefreshToken,
} = require("./util/auth");
const { getUsers, getUserById } = require("./util/users");
const express = require("express");
const client = require("./util/redis");

const PORT = process.env.AUTH_PORT || 4001;

const app = express();
app.use(express.json());

client.connect();

app.post("/users", (req, res) => {
  // TODO: implement registration
  res.sendStatus(501);
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
  const user = authenticateUser(username, password, users);
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
    client.set(user.id.toString(), refreshToken);

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

app.post("/token", verifyRefreshToken, async (req, res, next) => {
  const user_id = req.userId;
  const user = await getUserById(user_id);

  // send new tokens
  try {
    const accessToken = await signToken(user, "access");
    const refreshToken = await signToken(user, "refresh");
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
