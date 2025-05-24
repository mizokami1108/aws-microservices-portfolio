const express = require("express");
const cors = require("cors");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// DynamoDBクライアントの設定
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DDB_TABLE || "OrderTable";

// 注文ステータス定義
const ORDER_STATUS = {
  CREATED: "CREATED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

// ヘルスチェックエンドポイント
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "order-service" });
});

// 注文作成エンドポイント
app.post("/orders", async (req, res) => {
  const { userId, items, shippingAddress } = req.body;

  if (
    !userId ||
    !items ||
    !Array.isArray(items) ||
    items.length === 0 ||
    !shippingAddress
  ) {
    return res
      .status(400)
      .json({ error: "UserId, items array and shippingAddress are required" });
  }

  try {
    const orderId = uuidv4();
    const orderItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          orderId,
          userId,
          items: orderItems,
          shippingAddress,
          status: ORDER_STATUS.CREATED,
          totalAmount,
          createdAt: new Date().toISOString(),
        },
      })
    );

    res.status(201).json({
      message: "Order created successfully",
      orderId,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// 注文詳細取得エンドポイント
app.get("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res
      .status(400)
      .json({ error: "UserId query parameter is required" });
  }

  try {
    const { Item } = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId,
          userId,
        },
      })
    );

    if (!Item) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(Item);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ユーザーの注文一覧取得エンドポイント
app.get("/users/:userId/orders", async (req, res) => {
  const { userId } = req.params;

  try {
    const { Items } = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
    );

    res.json(Items || []);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});

// 注文ステータス更新エンドポイント
app.patch("/orders/:orderId/status", async (req, res) => {
  const { orderId } = req.params;
  const { userId, status } = req.body;

  if (!userId || !status) {
    return res.status(400).json({ error: "UserId and status are required" });
  }

  if (!Object.values(ORDER_STATUS).includes(status)) {
    return res.status(400).json({
      error: `Status must be one of: ${Object.values(ORDER_STATUS).join(", ")}`,
    });
  }

  try {
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          orderId,
          userId,
        },
        UpdateExpression: "set #s = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
          ":updatedAt": new Date().toISOString(),
        },
      })
    );

    res.json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Order service listening on port ${PORT}`);
});
