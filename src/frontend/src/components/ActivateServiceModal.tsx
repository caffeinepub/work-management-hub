import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface ActivateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivateServiceModal({ isOpen, onClose }: ActivateServiceModalProps) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedAsistenmu, setSelectedAsistenmu] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [unitQuantity, setUnitQuantity] = useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [priceDisplayValue, setPriceDisplayValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Close modal after successful submission
    onClose();
  };

  if (!isOpen) return null;

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
            {/* Client Selection */}
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1.5">
                Pilih Client
              </label>
              <select
                id="client"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="">-- Pilih Client --</option>
                <option value="PT Maju">PT Maju</option>
                <option value="CV Sejahtera">CV Sejahtera</option>
              </select>
              {errors.client && (
                <p className="mt-1 text-sm text-red-600">{errors.client}</p>
              )}
            </div>

            {/* Asistenmu Selection */}
            <div>
              <label htmlFor="asistenmu" className="block text-sm font-medium text-gray-700 mb-1.5">
                Pilih Asistenmu
              </label>
              <select
                id="asistenmu"
                value={selectedAsistenmu}
                onChange={(e) => setSelectedAsistenmu(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="">-- Pilih Asistenmu --</option>
                <option value="Budi">Budi</option>
                <option value="Siti">Siti</option>
              </select>
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
                <option value="Tenang">Tenang</option>
                <option value="Rapi">Rapi</option>
                <option value="Fokus">Fokus</option>
                <option value="Jaga">Jaga</option>
                <option value="Efisien">Efisien</option>
              </select>
              {errors.serviceType && (
                <p className="mt-1 text-sm text-red-600">{errors.serviceType}</p>
              )}
            </div>

            {/* Unit Quantity */}
            <div>
              <label htmlFor="unitQuantity" className="block text-sm font-medium text-gray-700 mb-1.5">
                Jumlah Unit Pembelian
              </label>
              <input
                type="number"
                id="unitQuantity"
                min="1"
                value={unitQuantity || ''}
                onChange={(e) => setUnitQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Masukkan jumlah unit"
              />
              {errors.unitQuantity && (
                <p className="mt-1 text-sm text-red-600">{errors.unitQuantity}</p>
              )}
              {/* Reactive helper text */}
              <p className="mt-1.5 text-sm text-gray-600">
                Setara dengan {effectiveHours} Jam Efektif
              </p>
            </div>

            {/* Price Per Unit */}
            <div>
              <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-1.5">
                Harga Jual Per Unit (Rp)
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
              {/* Reactive GMV calculation */}
              <p className="mt-1.5 text-sm font-bold text-emerald-600">
                Total Tagihan (GMV): Rp {formatCurrency(totalGMV)}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aktifkan Layanan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
