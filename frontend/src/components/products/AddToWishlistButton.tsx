"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { addToWishlist } from "@/lib/api/wishlist";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";

export function AddToWishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await addToWishlist(productId);
      setMessage("Added to wishlist");
    } catch (err) {
      setMessage(
        err instanceof ApiError ? err.message : "Could not add to wishlist",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        size="lg"
        className="w-full sm:w-auto"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? "Saving..." : "Add to wishlist"}
      </Button>
      {message ? (
        <p className={`mt-2 text-sm ${message.includes("Added") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
