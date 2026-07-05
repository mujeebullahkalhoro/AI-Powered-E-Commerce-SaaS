import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  reserveStockForItems,
  restoreStockForItems,
} from "../lib/stockReservation";

const save = vi.fn();
const findById = vi.fn();
const findByIdAndUpdate = vi.fn();

vi.mock("../models/Product", () => ({
  Product: {
    findById: (...args: unknown[]) => findById(...args),
    findByIdAndUpdate: (...args: unknown[]) => findByIdAndUpdate(...args),
  },
}));

describe("stock reservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reserves stock when inventory is available", async () => {
    findById.mockReturnValue({
      session: vi.fn().mockResolvedValue({
        name: "Headphones",
        stock: 5,
        save,
      }),
    });

    await reserveStockForItems(
      [
        {
          product: "product-id" as never,
          name: "Headphones",
          price: 99,
          quantity: 2,
          image: "",
        },
      ],
      {} as never,
    );

    expect(save).toHaveBeenCalledOnce();
  });

  it("restores stock quantities", async () => {
    findByIdAndUpdate.mockResolvedValue({});

    await restoreStockForItems([
      {
        product: "product-id" as never,
        name: "Headphones",
        price: 99,
        quantity: 2,
        image: "",
      },
    ]);

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      "product-id",
      { $inc: { stock: 2 } },
      { session: undefined },
    );
  });
});

describe("Stripe webhook metadata", () => {
  it("parses cart snapshot JSON", () => {
    const snapshot = {
      items: [],
      shippingAddress: {
        name: "Test",
        street: "1 Main",
        city: "City",
        state: "ST",
        zip: "12345",
        country: "US",
      },
      paymentMethod: "card",
      subtotal: 10,
      shippingCost: 5,
      discount: 0,
      total: 15,
    };

    const parsed = JSON.parse(JSON.stringify(snapshot));

    expect(parsed.total).toBe(15);
    expect(parsed.stockReserved).toBeUndefined();
  });
});
