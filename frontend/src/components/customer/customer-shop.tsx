"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { CustomerSidebar } from "./customer-sidebar"
import { ProductCatalog } from "./product-catalog"
import { ShoppingCart } from "./shopping-cart"
import { OrderHistory } from "./order-history"
import { UserProfile } from "./user-profile"

type CustomerSection = "catalog" | "cart" | "orders" | "profile"

export function CustomerShop() {
  const [activeSection, setActiveSection] = useState<CustomerSection>("catalog")

  const renderContent = () => {
    switch (activeSection) {
      case "catalog":
        return <ProductCatalog />
      case "cart":
        return <ShoppingCart />
      case "orders":
        return <OrderHistory />
      case "profile":
        return <UserProfile />
      default:
        return <ProductCatalog />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col md:flex-row">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <CustomerSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>

        {/* Main content with mobile padding adjustments */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{renderContent()}</main>

        {/* Mobile bottom navigation - hidden on desktop */}
        <div className="md:hidden">
          <CustomerSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>
      </div>
    </div>
  )
}
