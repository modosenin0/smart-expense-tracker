import request from "supertest";
import app from "../src/index.js";
import pool from "../src/config/db.js";

describe("Expenses API", () => {
  let authToken;
  let userId;
  let categoryId;
  let expenseId;

  beforeAll(async () => {
    // Clean up existing data
    await pool.query("DELETE FROM expenses;");
    await pool.query("DELETE FROM categories;");
    await pool.query("DELETE FROM users;");

    // Create a test user
    const userRes = await request(app)
      .post("/api/auth/register")
      .send({ 
        name: "Expense Test User", 
        email: "expense@test.com", 
        password: "123456" 
      });

    userId = userRes.body.id;

    // Login to get token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "expense@test.com", password: "123456" });

    authToken = loginRes.body.token;

    // Create a test category
    const categoryRes = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Test Category" });

    categoryId = categoryRes.body.id;
  }, 10000);

  afterAll(async () => {
    pool.end().catch(() => {});
  });

  describe("POST /api/expenses", () => {
    test("Should create a new expense with GBP currency", async () => {
      const expenseData = {
        category_id: categoryId,
        amount: 50.00,
        currency: "GBP",
        description: "Test expense in GBP",
        expense_date: "2025-09-24"
      };

      const res = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(expenseData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.amount).toBe("50.00");
      expect(res.body.currency).toBe("GBP");
      expect(res.body.description).toBe("Test expense in GBP");
      expect(res.body.user_id).toBe(userId);
      expect(res.body.category_id).toBe(categoryId);

      expenseId = res.body.id; // Save for later tests
    });

    test("Should create expense with currency conversion (mocked)", async () => {
      // Note: This test assumes the external API works or is mocked
      const expenseData = {
        category_id: categoryId,
        amount: 100.00,
        currency: "USD",
        description: "Test expense in USD",
        expense_date: "2025-09-24"
      };

      const res = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(expenseData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.amount).toBe("100.00");
      expect(res.body.currency).toBe("USD");
      expect(res.body).toHaveProperty("converted_amount");
    });

    test("Should fail without authentication", async () => {
      const expenseData = {
        category_id: categoryId,
        amount: 25.00,
        currency: "GBP",
        description: "Unauthorized expense",
        expense_date: "2025-09-24"
      };

      const res = await request(app)
        .post("/api/expenses")
        .send(expenseData);

      expect(res.statusCode).toBe(401);
    });

    test("Should fail with missing required fields", async () => {
      const res = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ amount: 25.00 }); // Missing required fields

      expect(res.statusCode).toBe(500);
    });
  });

  describe("GET /api/expenses", () => {
    test("Should get user's expenses", async () => {
      const res = await request(app)
        .get("/api/expenses")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      
      // Check if our created expense is in the list
      const expense = res.body.find(exp => exp.id === expenseId);
      expect(expense).toBeDefined();
      expect(expense.description).toBe("Test expense in GBP");
    });

    test("Should fail without authentication", async () => {
      const res = await request(app)
        .get("/api/expenses");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("PUT /api/expenses/:id", () => {
    test("Should update an expense", async () => {
      const updateData = {
        category_id: categoryId,
        amount: 75.00,
        currency: "GBP",
        description: "Updated test expense",
        expense_date: "2025-09-24"
      };

      const res = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.description).toBe("Updated test expense");
      expect(res.body.amount).toBe("75.00");
    });

    test("Should fail to update non-existent expense", async () => {
      const res = await request(app)
        .put("/api/expenses/99999")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ description: "Non-existent" });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Expense not found");
    });

    test("Should fail without authentication", async () => {
      const res = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .send({ description: "Unauthorized update" });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("DELETE /api/expenses/:id", () => {
    test("Should delete an expense", async () => {
      const res = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Expense deleted");
    });

    test("Should fail to delete non-existent expense", async () => {
      const res = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Expense not found");
    });

    test("Should fail without authentication", async () => {
      const res = await request(app)
        .delete(`/api/expenses/${expenseId}`);

      expect(res.statusCode).toBe(401);
    });
  });
});