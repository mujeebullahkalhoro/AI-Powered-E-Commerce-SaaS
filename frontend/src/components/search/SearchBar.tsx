"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface SearchBarProps {
  className?: string;
  inputClassName?: string;
  showButton?: boolean;
}

export function SearchBar({
  className = "",
  inputClassName = "",
  showButton = true,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = pathname === "/search" ? (searchParams.get("q") ?? "") : "";
  const [value, setValue] = useState(urlQuery);

  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  const navigateToSearch = (query: string) => {
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToSearch(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex min-w-0 flex-1 items-center gap-2 ${className}`}
    >
      <Input
        type="search"
        placeholder="Search products..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={inputClassName}
        aria-label="Search products"
      />
      {showButton ? (
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>
      ) : null}
    </form>
  );
}
