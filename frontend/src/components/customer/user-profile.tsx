"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { User, MapPin, CreditCard, Bell } from "lucide-react"
import axios from "@/lib/axios"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import type { AxiosError } from "axios"
import type { Address, User as UserType } from "@/types/type"

export function UserProfile() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [profile, setProfile] = useState<UserType | null>(null)
  const [address, setAddress] = useState<Address | null>(null)

  // ✅ Fetch profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await axios.get("/api/auth/me")
      return response.data.user as UserType
    },
  })

  // ✅ Sync profile state when data changes
  useEffect(() => {
    if (profileData) {
      setProfile(profileData)
      if (profileData.addresses && profileData.addresses.length > 0) {
        setAddress(profileData.addresses[0])
      }
    }
  }, [profileData])

  // ✅ Profile mutation
  const profileMutation = useMutation({
    mutationFn: async (updatedProfile: Partial<UserType>) => {
      const response = await axios.put("/api/auth/update", updatedProfile)
      return response.data
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully!" })
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast({
        title: "Error",
        description: error.response?.data.message || "Something went wrong",
        variant: "destructive",
      })
    },
  })

  // ✅ Address mutation
  const addressMutation = useMutation({
    mutationFn: async (updatedAddress: Partial<Address>) => {
      if (!address?.id) throw new Error("No address ID found")
      const response = await axios.put(`/api/address/${address.id}`, updatedAddress)
      return response.data
    },
    onSuccess: () => {
      toast({ title: "Address updated successfully!" })
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast({
        title: "Error",
        description: error.response?.data.message || "Something went wrong",
        variant: "destructive",
      })
    },
  })

  // ✅ Notifications
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotionalEmails: false,
    newProductAlerts: true,
  })

  const toggleNotification = (type: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
    toast({
      title: "Updated",
      description: `${type} ${notifications[type] ? "disabled" : "enabled"}!`,
    })
  }

  if (profileLoading) {
    return <p>Loading...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Address</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Payment</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              {profile && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    profileMutation.mutate(profile)
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profile.phone ?? ""}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit">Update Profile</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Tab */}
        <TabsContent value="address" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
              <CardDescription>Manage your default shipping address</CardDescription>
            </CardHeader>
            <CardContent>
              {address && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    addressMutation.mutate(address)
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={address.address}
                      onChange={(e) => setAddress({ ...address, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">ZIP Code</Label>
                      <Input
                        id="postal_code"
                        value={address.postal_code}
                        onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={address.country}
                        onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit">Update Address</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your saved payment methods</CardDescription>
            </CardHeader>
            <CardContent>Coming Soon</CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{key}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleNotification(key as keyof typeof notifications)}
                      >
                        {value ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
