export function formatOrderDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function truncateOrderId(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}

export function formatOrderStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
