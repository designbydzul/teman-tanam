'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Plant = {
  id: number
  created_at: string
  name: string
  type: string | null
}

export default function Home() {
  const [plantName, setPlantName] = useState('')
  const [plantType, setPlantType] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [plants, setPlants] = useState<Plant[]>([])

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

  // Load plants when page loads
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
            type: plantType.trim() || null
          }
        ])
        .select()

      if (error) throw error

      setMessage('✅ Tanaman berhasil ditambahkan!')
      setPlantName('')
      setPlantType('')
      
      fetchPlants() // Refresh the list!
      
    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ Gagal menambahkan tanaman')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5DC] flex flex-col items-center justify-center p-8">
      {/* Logo/Brand */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-[#2D5016] mb-2">
          TEMAN TANAM
        </h1>
        <p className="text-lg text-[#666666]">
          by Akar Nusa
        </p>
      </div>

      {/* Tagline */}
      <div className="text-center mb-12">
        <p className="text-2xl text-[#2C2C2C] font-semibold mb-2">
          Your companion for reconnection
        </p>
        <p className="text-lg text-[#666666]">
          Companion untuk tanaman kamu 🌱
        </p>
      </div>

      {/* Add Plant Form */}
      <div className="bg-white rounded-lg p-8 shadow-md max-w-md w-full mb-8">
        <h2 className="text-2xl font-semibold text-[#2D5016] mb-6">
          Tambah Tanaman
        </h2>

        <form onSubmit={addPlant} className="space-y-4">
          {/* Plant Name */}
          <div>
            <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
              Nama Tanaman *
            </label>
            <input
              type="text"
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="Cabai Merah, Tomat, dll"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CB342]"
              disabled={loading}
            />
          </div>

          {/* Plant Type */}
          <div>
            <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
              Jenis (Optional)
            </label>
            <input
              type="text"
              value={plantType}
              onChange={(e) => setPlantType(e.target.value)}
              placeholder="Sayur, Pohon, Tanaman Hias"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CB342]"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7CB342] text-white font-medium py-3 rounded-lg hover:bg-[#689F38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Menambahkan...' : 'Tambah Tanaman 🌱'}
          </button>
        </form>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Plant List */}
      {plants.length > 0 && (
        <div className="bg-white rounded-lg p-8 shadow-md max-w-md w-full">
          <h2 className="text-2xl font-semibold text-[#2D5016] mb-6">
            Tanaman Kamu ({plants.length})
          </h2>
          
          <div className="space-y-3">
            {plants.map((plant) => (
              <div 
                key={plant.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-[#2C2C2C]">
                      {plant.name}
                    </h3>
                    {plant.type && (
                      <span className="text-sm text-[#666666]">
                        {plant.type}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#999999]">
                    {new Date(plant.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon */}
      <div className="mt-12 text-center">
        <p className="text-[#999999] text-sm">
          MVP Development in Progress...
        </p>
        <p className="text-[#999999] text-sm">
          Built with values, not venture capital ✨
        </p>
      </div>
    </div>
  )
}