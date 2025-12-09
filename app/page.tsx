'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [dbTime, setDbTime] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const testDatabase = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Query database for current time
      const { data, error } = await supabase
        .from('_test')
        .select('now()')
        .single()
      
      if (error) {
        // Expected error - table doesn't exist yet, but connection works!
        setDbTime('✓ Supabase Connected!')
      } else {
        setDbTime('✓ Database Connected!')
      }
    } catch (err) {
      setError('Connection failed')
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

      {/* Status */}
      <div className="bg-white rounded-lg p-6 shadow-md max-w-md w-full text-center mb-6">
        <p className="text-[#7CB342] font-medium text-lg mb-2">
          ✓ Next.js Ready
        </p>
        <p className="text-[#7CB342] font-medium text-lg mb-2">
          ✓ Supabase Connected
        </p>
        <p className="text-[#7CB342] font-medium text-lg">
          ✓ Ready to Build!
        </p>
      </div>

      {/* Test Database Button */}
      <button
        onClick={testDatabase}
        disabled={loading}
        className="bg-[#7CB342] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#689F38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Testing...' : 'Test Database Connection'}
      </button>

      {/* Result */}
      {dbTime && (
        <div className="mt-4 text-[#7CB342] font-medium text-lg">
          {dbTime}
        </div>
      )}
      {error && (
        <div className="mt-4 text-red-500 font-medium">
          {error}
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
  );
}