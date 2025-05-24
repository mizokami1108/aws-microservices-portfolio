const express = require("express");
const cors = require("cors");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const app = express();
app.use(cors());
app.use(express.json());

// DynamoDBクライアントの設定
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DDB_TABLE || "UserTable";

// ヘルスチェックエンドポイント
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "user-service" });
});

// ユーザー一覧取得エンドポイント
app.get("/users", async (req, res) => {
  try {
    const { Items } = await ddbDocClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    res.json(Items || []);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ユーザー取得エンドポイント
app.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { Item } = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId },
      })
    );

    if (!Item) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(Item);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ユーザー登録エンドポイント
app.post("/users", async (req, res) => {
  const { userId, username, email } = req.body;

  if (!userId || !username || !email) {
    return res
      .status(400)
      .json({ error: "UserId, username and email are required" });
  }

  try {
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          userId,
          username,
          email,
          createdAt: new Date().toISOString(),
        },
      })
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// ユーザー削除エンドポイント
app.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId },
      })
    );

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`User service listening on port ${PORT}`);
});
