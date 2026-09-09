import type { SidebarNavItem } from "@/types";

export type DashboardConfig = {
  sidebarNav: SidebarNavItem[];
};

export const dashboardConfig: DashboardConfig = {
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: "layoutDashboard",
      items: [],
    },
    {
      title: "Products",
      href: "/admin/products",
      icon: "cart",
      items: [],
    },
    {
      title: "Collections",
      href: "/admin/collections",
      icon: "folder",
      items: [],
    },
    {
      title: "Medias",
      href: "/admin/medias",
      icon: "image",
      items: [],
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: "user",
      items: [],
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: "receipt",
      items: [],
    },
    {
      title: "중고폰 현황",
      href: "/admin/marketplace",
      icon: "layoutDashboard",
      items: [],
    },
    {
      title: "판매자 관리",
      href: "/admin/sellers",
      icon: "store",
      items: [],
    },
    {
      title: "중고폰 상품",
      href: "/admin/phones",
      icon: "package",
      items: [],
    },
    {
      title: "중고폰 주문",
      href: "/admin/phone-orders",
      icon: "receipt",
      items: [],
    },
    {
      title: "분쟁 관리",
      href: "/admin/disputes",
      icon: "pending",
      items: [],
    },
    {
      title: "플랫폼 설정",
      href: "/admin/settings",
      icon: "edit",
      items: [],
    },
  ],
};
