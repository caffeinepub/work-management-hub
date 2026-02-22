import React, { useState, useEffect } from 'react';
import { X, Check, ChevronsUpDown } from 'lucide-react';
import { useActor } from '../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import { User, Role, Status } from '../backend';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ActivateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivateServiceModal({ isOpen, onClose }: ActivateServiceModalProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedAsistenmu, setSelectedAsistenmu] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [unitQuantity, setUnitQuantity] = useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [priceDisplayValue, setPriceDisplayValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openClientCombo, setOpenClientCombo] = useState(false);
  const [openAsistenmuCombo, setOpenAsistenmuCombo] = useState(false);

  // Fetch all users for dropdowns
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      try {
        if (!actor) throw new Error('Actor not available');
        const approvals = await actor.listApprovals();
        const userPromises = approvals.map(approval => actor.getUserProfile(approval.principal));
        const users = await Promise.all(userPromises);
        return users.filter((u): u is User => u !== null);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        toast.error(`Failed to fetch users: ${error.message || 'Unknown error'}`);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && isOpen,
    retry: 2,
  });

  // Filter active clients
  const clientUsers = allUsers.filter(u => u.role === Role.client && u.status === Status.active);

  // Filter active asistenmu
  const asistenmuUsers = allUsers.filter(u => u.role === Role.asistenmu && u.status === Status.active);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedClient('');
      setSelectedAsistenmu('');
      setSelectedServiceType('');
      setUnitQuantity(0);
      setPricePerUnit(0);
      setPriceDisplayValue('');
      setErrors({});
      setOpenClientCombo(false);
      setOpenAsistenmuCombo(false);
    }
  }, [isOpen]);

  // Format number with thousand separator (dot)
  const formatCurrency = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Parse formatted string to number
  const parseFormattedNumber = (value: string): number => {
    const cleaned = value.replace(/\./g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Handle price input change with formatting
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = parseFormattedNumber(inputValue);
    
    setPricePerUnit(numericValue);
    setPriceDisplayValue(numericValue > 0 ? formatCurrency(numericValue) : '');
  };

  // Calculate effective hours (unit * 2)
  const effectiveHours = unitQuantity * 2;

  // Calculate total GMV
  const totalGMV = unitQuantity * pricePerUnit;

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedClient) {
      newErrors.client = 'Client harus dipilih';
    }
    if (!selectedAsistenmu) {
      newErrors.asistenmu = 'Asistenmu harus dipilih';
    }
    if (!selectedServiceType) {
      newErrors.serviceType = 'Tipe layanan harus dipilih';
    }
    if (unitQuantity < 1) {
      newErrors.unitQuantity = 'Jumlah unit minimal 1';
    }
    if (pricePerUnit <= 0) {
      newErrors.pricePerUnit = 'Harga jual harus lebih dari 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid
  const isFormValid = 
    selectedClient !== '' &&
    selectedAsistenmu !== '' &&
    selectedServiceType !== '' &&
    unitQuantity >= 1 &&
    pricePerUnit > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // TODO: Panggil fungsi backend Motoko aktifkanLayanan()
    console.log('Form submitted:', {
      selectedClient,
      selectedAsistenmu,
      selectedServiceType,
      unitQuantity,
      pricePerUnit,
      effectiveHours,
      totalGMV,
    });

    toast.success('Service activation submitted successfully!');
    // Close modal after successful submission
    onClose();
  };

  if (!isOpen) return null;

  // Get selected client and asistenmu names for display
  const selectedClientUser = clientUsers.find(u => u.principalId.toString() === selectedClient);
  const selectedAsistenmuUser = asistenmuUsers.find(u => u.principalId.toString() === selectedAsistenmu);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Aktivasi Layanan Baru</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="space-y-5">
            {/* Client Selection - Searchable Combobox */}
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1.5">
                Pilih Client
              </label>
              <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openClientCombo}
                    className="w-full justify-between"
                  >
                    {selectedClientUser ? selectedClientUser.name : "-- Pilih Client --"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Cari client..." />
                    <CommandList>
                      <CommandEmpty>
                        {usersLoading ? 'Loading...' : 'No client found.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {clientUsers.map((user) => (
                          <CommandItem
                            key={user.principalId.toString()}
                            value={user.name}
                            onSelect={() => {
                              setSelectedClient(user.principalId.toString());
                              setOpenClientCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedClient === user.principalId.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <div className="font-medium">{user.name}</div>
                              {user.companyBisnis && (
                                <div className="text-xs text-muted-foreground">{user.companyBisnis}</div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.client && (
                <p className="mt-1 text-sm text-red-600">{errors.client}</p>
              )}
            </div>

            {/* Asistenmu Selection - Searchable Combobox */}
            <div>
              <label htmlFor="asistenmu" className="block text-sm font-medium text-gray-700 mb-1.5">
                Pilih Asistenmu
              </label>
              <Popover open={openAsistenmuCombo} onOpenChange={setOpenAsistenmuCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openAsistenmuCombo}
                    className="w-full justify-between"
                  >
                    {selectedAsistenmuUser ? selectedAsistenmuUser.name : "-- Pilih Asistenmu --"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Cari asistenmu..." />
                    <CommandList>
                      <CommandEmpty>
                        {usersLoading ? 'Loading...' : 'No asistenmu found.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {asistenmuUsers.map((user) => (
                          <CommandItem
                            key={user.principalId.toString()}
                            value={user.name}
                            onSelect={() => {
                              setSelectedAsistenmu(user.principalId.toString());
                              setOpenAsistenmuCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedAsistenmu === user.principalId.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {user.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.asistenmu && (
                <p className="mt-1 text-sm text-red-600">{errors.asistenmu}</p>
              )}
            </div>

            {/* Service Type Selection */}
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1.5">
                Tipe Layanan
              </label>
              <select
                id="serviceType"
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="">-- Pilih Tipe Layanan --</option>
                <option value="reportWriting">Report Writing</option>
                <option value="assistance">Assistance</option>
                <option value="dataEntry">Data Entry</option>
              </select>
              {errors.serviceType && (
                <p className="mt-1 text-sm text-red-600">{errors.serviceType}</p>
              )}
            </div>

            {/* Unit Quantity */}
            <div>
              <label htmlFor="unitQuantity" className="block text-sm font-medium text-gray-700 mb-1.5">
                Jumlah Unit
              </label>
              <input
                type="number"
                id="unitQuantity"
                value={unitQuantity || ''}
                onChange={(e) => setUnitQuantity(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Masukkan jumlah unit"
              />
              {errors.unitQuantity && (
                <p className="mt-1 text-sm text-red-600">{errors.unitQuantity}</p>
              )}
            </div>

            {/* Price Per Unit */}
            <div>
              <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-1.5">
                Harga Jual per Unit (Rp)
              </label>
              <input
                type="text"
                id="pricePerUnit"
                value={priceDisplayValue}
                onChange={handlePriceChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Masukkan harga jual"
              />
              {errors.pricePerUnit && (
                <p className="mt-1 text-sm text-red-600">{errors.pricePerUnit}</p>
              )}
            </div>

            {/* Calculated Fields */}
            <div className="bg-gray-50 rounded-md p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Jam Efektif:</span>
                <span className="font-semibold text-gray-900">{effectiveHours} jam</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total GMV:</span>
                <span className="font-semibold text-emerald-600">Rp {formatCurrency(totalGMV)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                isFormValid
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Aktivasi Layanan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
