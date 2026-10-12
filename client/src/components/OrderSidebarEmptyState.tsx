import { getOrderSidebarEmptyLabel } from "@/lib/order-sidebar";

type OrderSidebarEmptyStateProps = {
  loading: boolean;
  count: number;
};

export function OrderSidebarEmptyState({
  loading,
  count,
}: OrderSidebarEmptyStateProps) {
  const label = getOrderSidebarEmptyLabel(loading, count);
  if (!label) return null;

  return (
    <div className="text-center py-12 text-slate-500 text-sm">
      {label}
    </div>
  );
}

export default OrderSidebarEmptyState;
