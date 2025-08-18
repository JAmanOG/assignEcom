import { useState, useEffect } from "react";
import { Plus, MapPin, Edit, Trash2, Star, Phone, Navigation, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import type { Address } from "@/types/type";
import { addressSchema } from "@/lib/validation/addressSchemas";

// Extend backend Address with optional notes (UI only / if backend supports it it will pass through)
type ApiAddress = Address & { notes?: string | null };

type ErrorResponse = { message: string };

type FormState = {
  id?: string; // present in edit mode
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
  notes?: string;
};

const initialFormState: FormState = {
  label: "",
  recipient_name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "IND",
  postal_code: "",
  is_default: false,
  notes: "",
};

const AddressSelectionDialog = ({ onAddressSelect }: { onAddressSelect: (address: ApiAddress) => void; }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<ApiAddress | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormState(initialFormState);
    setShowCreateForm(false);
    setIsEditMode(false);
  };

  const { data: addressData, isLoading, isError, error } = useQuery<ApiAddress[], AxiosError<ErrorResponse>>({
    queryKey: ["addresses"],
    queryFn: async () => {
      const res = await axios.get("/api/address");
      console.log("res",res)
      return res.data.addresses ?? res.data;
    },
    // staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (addressData && Array.isArray(addressData)) {
      setAddresses(addressData);
    }
  }, [addressData]);

  useEffect(() => {
    if (isError && error) {
      console.error("Error fetching addresses:", error);
      toast({
        title: "Error fetching addresses",
        description: error.response?.data?.message || "Unexpected error",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Add address
  const addAddressMutation = useMutation<ApiAddress, AxiosError<ErrorResponse>, Omit<ApiAddress, "id">>({
    mutationFn: async (payload) => {
      // Validate using Zod schema
      const validatedPayload = addressSchema.parse(payload);
      const res = await axios.post("/api/address", validatedPayload);
      return res.data.address ?? res.data;
    },
    onSuccess: (newAddr) => {
      toast({ title: "Address added", description: "Your address was saved.", variant: "success" });
      // If new default, unset other defaults locally before updating
      setAddresses((prev) => {
        const updated = newAddr.is_default ? prev.map(a => ({ ...a, is_default: false })) : prev;
        return [...updated, newAddr];
      });
      if (newAddr.is_default) setSelectedAddress(newAddr);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      resetForm();
    },
    onError: (error) => {
      console.error("Add error:", error);
      toast({
        title: "Could not add address",
        description: error.response?.data?.message || "Unexpected error",
        variant: "destructive",
      });
    },
  });

  // Update address
  const updateAddressMutation = useMutation<ApiAddress, AxiosError<ErrorResponse>, ApiAddress>({
    mutationFn: async (payload) => {
      const validatedPayload = addressSchema.parse(payload);
      const res = await axios.put(`/api/address/${validatedPayload.id}`, validatedPayload);
      return res.data.address ?? res.data;
    },
    onSuccess: (updated) => {
      toast({ title: "Address updated", description: "Saved changes to your address.", variant: "success" });
      setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)).map(a => updated.is_default ? { ...a, is_default: a.id === updated.id ? updated.is_default : false } : a));
      if (selectedAddress?.id === updated.id) setSelectedAddress(updated);
      if (updated.is_default) setSelectedAddress(updated);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      resetForm();
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Could not update address",
        description: error.response?.data?.message || "Unexpected error",
        variant: "destructive",
      });
    },
  });

  // Delete address
  const deleteAddressMutation = useMutation<unknown, AxiosError<ErrorResponse>, string>({
    mutationFn: async (id) => {
      const res = await axios.delete(`/api/address/${id}`);
      return res.data;
    },
    onSuccess: (_data, id) => {
      toast({ title: "Address removed", description: "Address was deleted.", variant: "success" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAddress?.id === id) setSelectedAddress(null);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Could not delete address",
        description: error.response?.data?.message || "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const openCreateForm = () => {
    resetForm();
    setShowCreateForm(true);
  };

  const handleEditAddress = (address: ApiAddress) => {
    setFormState({
      id: address.id,
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone || "",
      address: address.address,
      city: address.city || "",
      state: address.state || "",
      postal_code: address.postal_code || "",
      country: address.country || "IND",
      is_default: !!address.is_default,
      notes: address.notes || "",
    });
    setIsEditMode(true);
    setShowCreateForm(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    deleteAddressMutation.mutate(addressId);
  };

  const handleSaveAddress = () => {
    if (!formState.label.trim() || !formState.recipient_name.trim() || !formState.address.trim()) {
      toast({ title: "Validation", description: "Label, recipient name and address are required.", variant: "destructive" });
      return;
    }

    if (isEditMode && formState.id) {
      updateAddressMutation.mutate({ ...(formState as ApiAddress) });
      return;
    }

    const { id: _omit, ...payload } = formState; // exclude id for creation
    addAddressMutation.mutate(payload as Omit<ApiAddress, "id">);
  };

  const handleConfirmAddress = () => {
    if (!selectedAddress) return;
    console.log("Selected address:", selectedAddress);
    onAddressSelect(selectedAddress);
    setIsOpen(false);
  };

  const anyMutationLoading = addAddressMutation.isPending || updateAddressMutation.isPending || deleteAddressMutation.isPending;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <MapPin size={16} />
        Select Shipping Address
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto shadow-xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold flex items-center mb-4">
                <Navigation className="mr-2" size={20} />
                {showCreateForm ? (isEditMode ? "Edit Address" : "Add New Address") : "Select Shipping Address"}
              </h2>

              {!showCreateForm ? (
                <div className="space-y-4">
                  <button
                    onClick={openCreateForm}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50 rounded-lg p-4 flex items-center justify-center gap-2 text-gray-600"
                  >
                    <Plus size={16} />
                    Add New Address
                  </button>

                  <hr className="my-4" />

                  {isLoading ? (
                    <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
                      <Loader2 className="animate-spin" size={18} /> Loading addresses...
                    </div>
                  ) : addresses.length === 0 ? (
                    <p className="text-sm text-gray-500">No addresses yet. Add your first one.</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          onClick={() => setSelectedAddress(address)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedAddress?.id === address.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{address.label}</h3>
                              {address.is_default && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <Star size={12} /> Default
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAddress(address);
                                }}
                                className="p-1 text-gray-500 hover:text-gray-700"
                                aria-label="Edit address"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAddress(address.id);
                                }}
                                className="p-1 text-red-500 hover:text-red-700"
                                aria-label="Delete address"
                                disabled={deleteAddressMutation.isPending}
                              >
                                {deleteAddressMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="font-medium text-gray-900">{address.recipient_name}</p>
                            {address.phone && (
                              <div className="flex items-center gap-1">
                                <Phone size={12} /> {address.phone}
                              </div>
                            )}
                            <div className="flex items-start gap-1">
                              <MapPin size={12} className="mt-0.5" />
                              <div>
                                <p>{address.address}</p>
                                <p>
                                  {address.city}, {address.state} {address.postal_code}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedAddress && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Selected Address:</h3>
                      <p className="text-sm text-blue-800">
                        <strong>{selectedAddress.label}</strong> - {selectedAddress.recipient_name}
                        <br />
                        {selectedAddress.address}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleConfirmAddress}
                      disabled={!selectedAddress}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded-lg"
                    >
                      Confirm Address
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Address Label *</label>
                      <input
                        type="text"
                        placeholder="e.g., Home, Office"
                        value={formState.label}
                        onChange={(e) => setFormState({ ...formState, label: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Recipient Name *</label>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={formState.recipient_name}
                        onChange={(e) => setFormState({ ...formState, recipient_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 123-4567"
                        value={formState.phone}
                        onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Postal Code</label>
                      <input
                        type="text"
                        placeholder="12345"
                        value={formState.postal_code}
                        onChange={(e) => setFormState({ ...formState, postal_code: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Street Address *</label>
                    <input
                      type="text"
                      placeholder="123 Main Street, Apt 4B"
                      value={formState.address}
                      onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input
                        type="text"
                        placeholder="New York"
                        value={formState.city}
                        onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium mb-1">State</label>
                      <input
                        type="text"
                        placeholder="NY"
                        value={formState.state}
                        onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium mb-1">Country</label>
                      <input
                        type="text"
                        placeholder="IND"
                        value={formState.country}
                        onChange={(e) => setFormState({ ...formState, country: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Delivery Notes (Optional)</label>
                    <textarea
                      placeholder="Any special delivery instructions..."
                      rows={2}
                      value={formState.notes}
                      onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formState.is_default}
                      onChange={(e) => setFormState({ ...formState, is_default: e.target.checked })}
                    />
                    <label htmlFor="is_default" className="text-sm">
                      Set as default address
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveAddress}
                      disabled={anyMutationLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      {anyMutationLoading && <Loader2 size={16} className="animate-spin" />}
                      {isEditMode ? "Update Address" : "Save Address"}
                    </button>
                    <button
                      onClick={resetForm}
                      disabled={anyMutationLoading}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSelectionDialog;