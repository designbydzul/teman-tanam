'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MagnifyingGlass,
  Plus,
  WifiHigh,
  SquaresFour,
  FlowerLotus
} from '@phosphor-icons/react'

type Plant = {
  id: number
  created_at: string
  name: string
  type: string | null
  location?: string | null
  status?: string | null
  image_url?: string | null
  scientific_name?: string | null
}

type CategoryFilter = 'Semua' | 'Teras' | 'Balkon' | 'Indoor'

export default function Home() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Semua')
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Form state
  const [plantName, setPlantName] = useState('')
  const [plantType, setPlantType] = useState('')
  const [plantLocation, setPlantLocation] = useState('')
  const [scientificName, setScientificName] = useState('')

  // User name (could be from auth later)
  const userName = 'Dzul'

  // Fetch plants from database
  const fetchPlants = async () => {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching plants:', error)
    } else {
      setPlants(data || [])
    }
  }

  useEffect(() => {
    fetchPlants()
  }, [])

  // Add new plant
  const addPlant = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!plantName.trim()) {
      setMessage('❌ Nama tanaman harus diisi!')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase
        .from('plants')
        .insert([
          {
            name: plantName.trim(),
            type: plantType.trim() || null,
            location: plantLocation || null,
            scientific_name: scientificName.trim() || null,
            status: 'Baik Baik Saja'
          }
        ])
        .select()

      if (error) throw error

      setMessage('✅ Tanaman berhasil ditambahkan!')
      setPlantName('')
      setPlantType('')
      setPlantLocation('')
      setScientificName('')

      fetchPlants()

      // Close modal after success
      setTimeout(() => {
        setShowAddModal(false)
        setMessage('')
      }, 1500)

    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ Gagal menambahkan tanaman')
    } finally {
      setLoading(false)
    }
  }

  // Filter plants based on search and category
  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plant.type?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'Semua' || plant.location === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-start justify-between mb-6">
          {/* Handwritten Greeting */}
          <h1
            className="text-5xl font-bold text-[#2D5016]"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            Halo {userName}
          </h1>

          {/* Header Icons */}
          <div className="flex gap-3">
            <button className="w-14 h-14 rounded-full bg-[#E8F5E0] flex items-center justify-center hover:bg-[#d5ecc8] transition-colors">
              <WifiHigh size={24} weight="regular" className="text-[#2D5016]" />
            </button>
            <button className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors">
              <SquaresFour size={24} weight="regular" className="text-[#2D5016]" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Cari tanaman"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-5 pr-12 py-4 rounded-2xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7CB342]/20 focus:border-[#7CB342] text-gray-600 placeholder:text-gray-400"
          />
          <MagnifyingGlass
            className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={22}
            weight="regular"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {(['Semua', 'Teras', 'Balkon'] as CategoryFilter[]).map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-6 py-3 rounded-full whitespace-nowrap transition-all text-base ${
                categoryFilter === category
                  ? 'bg-[#E8F5E0] text-[#2D5016] font-medium'
                  : 'bg-transparent text-gray-500 font-normal'
              }`}
            >
              {category}
            </button>
          ))}
          <button className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <Plus size={24} weight="regular" />
          </button>
        </div>
      </div>

      {/* Plant Grid */}
      <div className="px-4 pb-24">
        {filteredPlants.length === 0 ? (
          <div className="text-center py-16">
            <FlowerLotus size={64} className="mx-auto text-gray-300 mb-4" weight="thin" />
            <p className="text-gray-500 text-base">
              {searchQuery || categoryFilter !== 'Semua'
                ? 'Tidak ada tanaman yang sesuai'
                : 'Belum ada tanaman. Tambah tanaman pertama kamu!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredPlants.map((plant) => (
              <div
                key={plant.id}
                className="flex flex-col cursor-pointer"
              >
                {/* Plant Image - Squircle Shape */}
                <div className="relative aspect-square mb-3 rounded-[28px] overflow-hidden bg-gradient-to-br from-green-100 to-green-50">
                  {plant.image_url ? (
                    <img
                      src={plant.image_url}
                      alt={plant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FlowerLotus size={48} className="text-green-200" weight="thin" />
                    </div>
                  )}
                </div>

                {/* Plant Name */}
                <h3 className="text-base font-semibold text-[#2D5016] mb-1 line-clamp-1">
                  {plant.name}
                </h3>

                {/* Plant Status */}
                <p className="text-sm text-gray-500 line-clamp-1">
                  {plant.status || 'Baik Baik Saja'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-6 w-16 h-16 bg-[#7CB342] hover:bg-[#689F38] text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
        aria-label="Tambah tanaman"
      >
        <Plus size={32} weight="bold" />
      </button>

      {/* Add Plant Modal - Keeping the previous modal design */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-2xl font-bold text-[#2D5016]">
                Tambah Tanaman Baru
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus size={24} weight="bold" className="rotate-45" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={addPlant} className="p-6 space-y-6">
              {/* Plant Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Tanaman *
                </label>
                <input
                  type="text"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  placeholder="Contoh: Monstera Deliciosa"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7CB342] focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Scientific Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Latin (Opsional)
                </label>
                <input
                  type="text"
                  value={scientificName}
                  onChange={(e) => setScientificName(e.target.value)}
                  placeholder="Contoh: Monstera deliciosa"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7CB342] focus:border-transparent italic"
                  disabled={loading}
                />
              </div>

              {/* Type and Location Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plant Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis
                  </label>
                  <input
                    type="text"
                    value={plantType}
                    onChange={(e) => setPlantType(e.target.value)}
                    placeholder="Tanaman Hias"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7CB342] focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                {/* Location Chips */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokasi
                  </label>
                  <div className="flex gap-2">
                    {['Teras', 'Balkon', 'Indoor'].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setPlantLocation(loc)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${
                          plantLocation === loc
                            ? 'bg-[#7CB342] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-xl text-center ${
                  message.includes('✅')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-[#7CB342] text-white font-medium rounded-xl hover:bg-[#689F38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Tanaman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
