'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MagnifyingGlass,
  Plus,
  Drop,
  Sun,
  MapPin,
  X,
  Camera,
  CalendarBlank,
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
  const userName = 'Teman'

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
            status: 'Sehat'
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
    <div className="min-h-screen bg-[#F5F5DC] pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Handwritten Greeting */}
          <h1 className="text-4xl font-bold text-[#2D5016] mb-6" style={{ fontFamily: 'var(--font-caveat)' }}>
            Halo {userName}! 👋
          </h1>

          {/* Search Bar */}
          <div className="relative mb-6">
            <MagnifyingGlass
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
              weight="bold"
            />
            <input
              type="text"
              placeholder="Cari tanaman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7CB342] focus:border-transparent"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {(['Semua', 'Teras', 'Balkon', 'Indoor'] as CategoryFilter[]).map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  categoryFilter === category
                    ? 'bg-[#7CB342] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plant Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPlants.length === 0 ? (
          <div className="text-center py-16">
            <FlowerLotus size={64} className="mx-auto text-gray-300 mb-4" weight="thin" />
            <p className="text-gray-500 text-lg">
              {searchQuery || categoryFilter !== 'Semua'
                ? 'Tidak ada tanaman yang sesuai'
                : 'Belum ada tanaman. Tambah tanaman pertama kamu!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlants.map((plant) => (
              <div
                key={plant.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Plant Image */}
                <div className="relative h-48 bg-gradient-to-br from-green-100 to-green-50">
                  {plant.image_url ? (
                    <img
                      src={plant.image_url}
                      alt={plant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FlowerLotus size={64} className="text-green-200" weight="thin" />
                    </div>
                  )}

                  {/* Status Badge */}
                  {plant.status && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-[#7CB342]">
                      {plant.status}
                    </div>
                  )}
                </div>

                {/* Plant Info */}
                <div className="p-4">
                  {/* Handwritten Plant Name */}
                  <h3
                    className="text-2xl font-bold text-[#2D5016] mb-1"
                    style={{ fontFamily: 'var(--font-caveat)' }}
                  >
                    {plant.name}
                  </h3>

                  {/* Scientific Name */}
                  {plant.scientific_name && (
                    <p className="text-sm text-gray-500 italic mb-2">
                      {plant.scientific_name}
                    </p>
                  )}

                  {/* Type */}
                  {plant.type && (
                    <p className="text-sm text-gray-600 mb-3">
                      {plant.type}
                    </p>
                  )}

                  {/* Location */}
                  {plant.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin size={16} weight="fill" />
                      <span>{plant.location}</span>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      <Drop size={18} weight="fill" />
                      <span className="text-sm">Siram</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                      <Sun size={18} weight="fill" />
                      <span className="text-sm">Pupuk</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#7CB342] hover:bg-[#689F38] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        aria-label="Tambah tanaman"
      >
        <Plus size={28} weight="bold" />
      </button>

      {/* Add Plant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#2D5016]">
                Tambah Tanaman Baru
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} weight="bold" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={addPlant} className="p-6 space-y-6">
              {/* Photo Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#7CB342] transition-colors cursor-pointer">
                <Camera size={48} className="mx-auto text-gray-400 mb-2" weight="thin" />
                <p className="text-gray-600 mb-1">Tambah foto tanaman</p>
                <p className="text-sm text-gray-400">Opsional</p>
              </div>

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

              {/* Date Added */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Ditambahkan
                </label>
                <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                  <CalendarBlank size={20} weight="bold" className="text-gray-400" />
                  <span className="text-gray-600">
                    {new Date().toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
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

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#2D5016]">TEMAN TANAM</p>
              <p className="text-xs text-gray-500">by Akar Nusa</p>
            </div>
            <p className="text-xs text-gray-400">
              {plants.length} tanaman
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
