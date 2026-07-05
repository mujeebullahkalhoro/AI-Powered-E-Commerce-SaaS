import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("Health endpoint", () => {
  it("returns API and MongoDB status", async () => {
    const response = await request(app).get("/health");

    expect(response.body.api).toBe("ok");
    expect(response.body).toHaveProperty("mongodb");
    expect(response.body).toHaveProperty("uptime");
    expect(response.body).toHaveProperty("version");
  });
});

describe("Auth validation", () => {
  it("rejects invalid register payload", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "not-an-email", password: "short" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects login without password", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@example.com" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe("Search validation", () => {
  it("requires search query parameter", async () => {
    const response = await request(app).get("/api/v1/search");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
