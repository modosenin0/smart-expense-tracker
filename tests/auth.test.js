import request from "supertest";
import app from "../src/index.js";
import pool from "../src/config/db.js";

describe("Auth API", () => {
  beforeAll(async () => {
    await pool.query("DELETE FROM users;"); // clean slate
  }, 10000);

  afterAll(async () => {
    // Jest will force exit, so we don't need to wait for pool cleanup
    pool.end().catch(() => {});
  });

  test("Register new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "test@test.com", password: "123456" });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe("test@test.com");
  });

  test("Login with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "123456" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});
