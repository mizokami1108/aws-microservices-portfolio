const express = require("express");
const cors = require("cors");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const app = express();
app.use(cors());
app.use(express.json());

// DynamoDBクライアントの設定
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DDB_TABLE || "ProductTable";

// ヘルスチェックエンドポイント
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "product-service" });
});

// 商品一覧取得エンドポイント
app.get("/products", async (req, res) => {
  try {
    const { Items } = await ddbDocClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    res.json(Items || []);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// 商品取得エンドポイント
app.get("/products/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const { Item } = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { productId },
      })
    );

    if (!Item) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(Item);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// 商品登録エンドポイント
app.post("/products", async (req, res) => {
  const { productId, name, price, description, category } = req.body;

  if (!productId || !name || !price) {
    return res
      .status(400)
      .json({ error: "ProductId, name and price are required" });
  }

  try {
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          productId,
          name,
          price,
          description: description || "",
          category: category || "uncategorized",
          createdAt: new Date().toISOString(),
        },
      })
    );

    res.status(201).json({ message: "Product created successfully" });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// 商品更新エンドポイント
app.put("/products/:productId", async (req, res) => {
  const { productId } = req.params;
  const { name, price, description, category } = req.body;

  if (!name && !price && !description && !category) {
    return res
      .status(400)
      .json({ error: "At least one field to update is required" });
  }

  try {
    // 更新する属性を動的に構築
    let updateExpression = "set";
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (name) {
      updateExpression += " #n = :name,";
      expressionAttributeNames["#n"] = "name";
      expressionAttributeValues[":name"] = name;
    }

    if (price) {
      updateExpression += " #p = :price,";
      expressionAttributeNames["#p"] = "price";
      expressionAttributeValues[":price"] = price;
    }

    if (description) {
      updateExpression += " #d = :description,";
      expressionAttributeNames["#d"] = "description";
      expressionAttributeValues[":description"] = description;
    }

    if (category) {
      updateExpression += " #c = :category,";
      expressionAttributeNames["#c"] = "category";
      expressionAttributeValues[":category"] = category;
    }

    // 最後のカンマを削除
    updateExpression = updateExpression.slice(0, -1);

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { productId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    res.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// 商品削除エンドポイント
app.delete("/products/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { productId },
      })
    );

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Product service listening on port ${PORT}`);
});
