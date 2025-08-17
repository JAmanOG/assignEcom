"use client"

import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface AppUser {
  id: string
  email: string
  role: "admin" | "customer" | "delivery"
  name: string
}

export function Header() {
  const [user, setUser] = useState<AppUser | null>(null)
  const navigate = useNavigate(); 

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    setUser(null)
    navigate("/login", { replace: true })
  }

  if (!user) return null

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {user.role === "admin" && "Admin Dashboard"}
              {user.role === "customer" && "Shop"}
              {user.role === "delivery" && "Delivery Dashboard"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <LogOut className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{user.name}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">{user.role}</span>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
