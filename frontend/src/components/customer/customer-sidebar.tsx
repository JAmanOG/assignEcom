"use client"

import { ShoppingBag, ShoppingCart, History, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CustomerSidebarProps {
  activeSection: string
  onSectionChange: (section: "catalog" | "cart" | "orders" | "profile") => void
}

export function CustomerSidebar({ activeSection, onSectionChange }: CustomerSidebarProps) {
  const menuItems = [
    { id: "catalog", label: "Shop", icon: ShoppingBag },
    { id: "cart", label: "Cart", icon: ShoppingCart },
    { id: "orders", label: "Orders", icon: History },
    { id: "profile", label: "Profile", icon: User },
  ]

  return (
    <>
      <aside className="hidden md:block w-64 bg-white shadow-sm border-r min-h-screen">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Shop</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => onSectionChange(item.id as any)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id as any)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-0 flex-1 ${
                  isActive ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
