import request from "supertest";
import app from "../src/index.js";
import pool from "../src/config/db.js";

describe("Analytics API", () => {
  let authToken;
  let userId;
  let categoryIds = [];

  beforeAll(async () => {
    // Clean up existing data
    await pool.query("DELETE FROM expenses;");
    await pool.query("DELETE FROM categories;");
    await pool.query("DELETE FROM users;");

    // Create a test user
    const userRes = await request(app)
      .post("/api/auth/register")
      .send({ 
        name: "Analytics Test User", 
        email: "analytics@test.com", 
        password: "123456" 
      });

    userId = userRes.body.id;

    // Login to get token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "analytics@test.com", password: "123456" });

    authToken = loginRes.body.token;

    // Create test categories
    const categories = ["Food", "Transport", "Entertainment"];
    for (const categoryName of categories) {
      const categoryRes = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: categoryName });
      
      categoryIds.push(categoryRes.body.id);
    }

    // Create test expenses for analytics
    const expenses = [
      { category_id: categoryIds[0], amount: 100, currency: "GBP", description: "Food expense 1", expense_date: "2025-09-01" },
      { category_id: categoryIds[0], amount: 150, currency: "GBP", description: "Food expense 2", expense_date: "2025-09-15" },
      { category_id: categoryIds[1], amount: 50, currency: "GBP", description: "Transport expense 1", expense_date: "2025-09-10" },
      { category_id: categoryIds[1], amount: 75, currency: "GBP", description: "Transport expense 2", expense_date: "2025-09-20" },
      { category_id: categoryIds[2], amount: 80, currency: "GBP", description: "Entertainment expense", expense_date: "2025-09-12" },
      // Add some expenses from previous months for trend analysis
      { category_id: categoryIds[0], amount: 200, currency: "GBP", description: "Food previous month", expense_date: "2025-08-15" },
      { category_id: categoryIds[1], amount: 90, currency: "GBP", description: "Transport previous month", expense_date: "2025-08-20" },
    ];

    for (const expense of expenses) {
      await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(expense);
    }
  }, 15000);

  afterAll(async () => {
    pool.end().catch(() => {});
  });

  describe("GET /api/analytics/categories", () => {
    test("Should get category totals for current month", async () => {
      const res = await request(app)
        .get("/api/analytics/categories")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Check that we have data for our categories
      const foodTotal = res.body.find(item => item.category === "Food");
      const transportTotal = res.body.find(item => item.category === "Transport");
      const entertainmentTotal = res.body.find(item => item.category === "Entertainment");

      expect(foodTotal).toBeDefined();
      expect(transportTotal).toBeDefined();
      expect(entertainmentTotal).toBeDefined();

      // Check totals (should be current month only: Sept 2025)
      expect(parseFloat(foodTotal.total_gbp)).toBe(250); // 100 + 150
      expect(parseFloat(transportTotal.total_gbp)).toBe(125); // 50 + 75
      expect(parseFloat(entertainmentTotal.total_gbp)).toBe(80); // 80

      // Check that each entry has the required fields
      res.body.forEach(item => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("total_gbp");
        expect(typeof item.total_gbp).toBe("string"); // PostgreSQL returns decimals as strings
      });
    });

    test("Should fail without authentication", async () => {
      const res = await request(app)
        .get("/api/analytics/categories");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/analytics/monthly", () => {
    test("Should get monthly spending trend", async () => {
      const res = await request(app)
        .get("/api/analytics/monthly")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Should have data for at least August and September 2025
      const septemberData = res.body.find(item => 
        item.month === "2025-09-01" || item.month.includes("2025-09")
      );
      const augustData = res.body.find(item => 
        item.month === "2025-08-01" || item.month.includes("2025-08")
      );

      expect(septemberData).toBeDefined();
      expect(augustData).toBeDefined();

      // Check September total (all September expenses)
      if (septemberData) {
        expect(parseFloat(septemberData.total)).toBe(455); // 100+150+50+75+80
      }

      // Check August total
      if (augustData) {
        expect(parseFloat(augustData.total)).toBe(290); // 200+90
      }

      // Check that each entry has the required fields
      res.body.forEach(item => {
        expect(item).toHaveProperty("month");
        expect(item).toHaveProperty("total");
        expect(typeof item.total).toBe("string");
      });
    });

    test("Should fail without authentication", async () => {
      const res = await request(app)
        .get("/api/analytics/monthly");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/analytics/top", () => {
    test("Should get top 3 categories", async () => {
      const res = await request(app)
        .get("/api/analytics/top")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeLessThanOrEqual(3); // Top 3 categories

      // Should be sorted by total in descending order
      for (let i = 0; i < res.body.length - 1; i++) {
        const current = parseFloat(res.body[i].total);
        const next = parseFloat(res.body[i + 1].total);
        expect(current).toBeGreaterThanOrEqual(next);
      }

      // Check that Food is likely the top category (has highest total: 350 = 250 current + 100 previous months)
      if (res.body.length > 0) {
        expect(res.body[0].category).toBe("Food");
      }

      // Check that each entry has the required fields
      res.body.forEach(item => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("total");
        expect(typeof item.total).toBe("string");
      });
    });

    test("Should fail without authentication", async () => {
      const res = await request(app)
        .get("/api/analytics/top");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("Analytics data isolation between users", () => {
    test("Different users should only see their own analytics data", async () => {
      // Create another user
      const user2Res = await request(app)
        .post("/api/auth/register")
        .send({ 
          name: "User Two Analytics", 
          email: "user2analytics@test.com", 
          password: "123456" 
        });

      const user2LoginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "user2analytics@test.com", password: "123456" });

      const user2Token = user2LoginRes.body.token;

      // User 2 should have no analytics data initially
      const categoriesRes = await request(app)
        .get("/api/analytics/categories")
        .set("Authorization", `Bearer ${user2Token}`);

      const monthlyRes = await request(app)
        .get("/api/analytics/monthly")
        .set("Authorization", `Bearer ${user2Token}`);

      const topRes = await request(app)
        .get("/api/analytics/top")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(categoriesRes.statusCode).toBe(200);
      expect(monthlyRes.statusCode).toBe(200);
      expect(topRes.statusCode).toBe(200);

      expect(categoriesRes.body.length).toBe(0);
      expect(monthlyRes.body.length).toBe(0);
      expect(topRes.body.length).toBe(0);
    });
  });

  describe("Analytics with no data", () => {
    test("Should handle user with no expenses gracefully", async () => {
      // Create a user with no expenses
      const noDataUserRes = await request(app)
        .post("/api/auth/register")
        .send({ 
          name: "No Data User", 
          email: "nodata@test.com", 
          password: "123456" 
        });

      const noDataLoginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "nodata@test.com", password: "123456" });

      const noDataToken = noDataLoginRes.body.token;

      const categoriesRes = await request(app)
        .get("/api/analytics/categories")
        .set("Authorization", `Bearer ${noDataToken}`);

      const monthlyRes = await request(app)
        .get("/api/analytics/monthly")
        .set("Authorization", `Bearer ${noDataToken}`);

      const topRes = await request(app)
        .get("/api/analytics/top")
        .set("Authorization", `Bearer ${noDataToken}`);

      expect(categoriesRes.statusCode).toBe(200);
      expect(monthlyRes.statusCode).toBe(200);
      expect(topRes.statusCode).toBe(200);

      expect(Array.isArray(categoriesRes.body)).toBe(true);
      expect(Array.isArray(monthlyRes.body)).toBe(true);
      expect(Array.isArray(topRes.body)).toBe(true);

      expect(categoriesRes.body.length).toBe(0);
      expect(monthlyRes.body.length).toBe(0);
      expect(topRes.body.length).toBe(0);
    });
  });
});