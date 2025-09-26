import request from "supertest";
import app from "../src/index.js";
import pool from "../src/config/db.js";

describe("Categories API", () => {
  let authToken;
  let userId;
  let categoryId;

  beforeAll(async () => {
    // Clean up existing data
    await pool.query("DELETE FROM expenses;");
    await pool.query("DELETE FROM categories;");
    await pool.query("DELETE FROM users;");

    // Create a test user
    const userRes = await request(app)
      .post("/api/auth/register")
      .send({ 
        name: "Category Test User", 
        email: "category@test.com", 
        password: "123456" 
      });

    userId = userRes.body.id;

    // Login to get token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "category@test.com", password: "123456" });

    authToken = loginRes.body.token;
  }, 10000);

  afterAll(async () => {
    pool.end().catch(() => {});
  });

  describe("POST /api/categories", () => {
    test("Should create a new category", async () => {
      const categoryData = {
        name: "Food & Dining"
      };

      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${authToken}`)
        .send(categoryData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("Food & Dining");
      expect(res.body.user_id).toBe(userId);

      categoryId = res.body.id; // Save for later tests
    });

    test("Should create another category", async () => {
      const categoryData = {
        name: "Transportation"
      };

      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${authToken}`)
        .send(categoryData);

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe("Transportation");
      expect(res.body.user_id).toBe(userId);
    });

    test("Should fail without authentication", async () => {
      const categoryData = {
        name: "Unauthorized Category"
      };

      const res = await request(app)
        .post("/api/categories")
        .send(categoryData);

      expect(res.statusCode).toBe(401);
    });

    test("Should fail with missing name", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${authToken}`)
        .send({}); // Missing name

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Category name required");
    });

    test("Should fail with empty name", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Category name required");
    });
  });

  describe("GET /api/categories", () => {
    test("Should get user's categories", async () => {
      const res = await request(app)
        .get("/api/categories")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2); // We created 2 categories

      // Check if our categories are in the list
      const foodCategory = res.body.find(cat => cat.name === "Food & Dining");
      const transportCategory = res.body.find(cat => cat.name === "Transportation");
      
      expect(foodCategory).toBeDefined();
      expect(transportCategory).toBeDefined();
      expect(foodCategory.user_id).toBe(userId);
      expect(transportCategory.user_id).toBe(userId);
    });

    test("Should return empty array for user with no categories", async () => {
      // Create another user
      const newUserRes = await request(app)
        .post("/api/auth/register")
        .send({ 
          name: "No Categories User", 
          email: "nocategories@test.com", 
          password: "123456" 
        });

      const newLoginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "nocategories@test.com", password: "123456" });

      const newAuthToken = newLoginRes.body.token;

      const res = await request(app)
        .get("/api/categories")
        .set("Authorization", `Bearer ${newAuthToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    test("Should fail without authentication", async () => {
      const res = await request(app)
        .get("/api/categories");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("Category isolation between users", () => {
    test("Different users should only see their own categories", async () => {
      // Create another user
      const user2Res = await request(app)
        .post("/api/auth/register")
        .send({ 
          name: "User Two", 
          email: "user2@test.com", 
          password: "123456" 
        });

      const user2LoginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "user2@test.com", password: "123456" });

      const user2Token = user2LoginRes.body.token;

      // Create a category for user 2
      await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ name: "User 2 Category" });

      // Get categories for user 1 (should not see user 2's category)
      const user1CategoriesRes = await request(app)
        .get("/api/categories")
        .set("Authorization", `Bearer ${authToken}`);

      expect(user1CategoriesRes.statusCode).toBe(200);
      const user1Categories = user1CategoriesRes.body;
      expect(user1Categories.every(cat => cat.user_id === userId)).toBe(true);
      expect(user1Categories.find(cat => cat.name === "User 2 Category")).toBeUndefined();

      // Get categories for user 2 (should only see their own)
      const user2CategoriesRes = await request(app)
        .get("/api/categories")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(user2CategoriesRes.statusCode).toBe(200);
      const user2Categories = user2CategoriesRes.body;
      expect(user2Categories.length).toBe(1);
      expect(user2Categories[0].name).toBe("User 2 Category");
      expect(user2Categories[0].user_id).toBe(user2Res.body.id);
    });
  });
});