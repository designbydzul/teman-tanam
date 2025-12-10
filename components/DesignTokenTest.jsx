/**
 * Design Token Test Component
 *
 * This component demonstrates the use of Tailwind utilities
 * with our custom design tokens from the Teman Tanam design system.
 */

import React from 'react';

const DesignTokenTest = () => {
  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* CSS Load Test */}
        <div style={{
          backgroundColor: '#7CB342',
          padding: '20px',
          borderRadius: '8px',
          color: 'white',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          ✅ CSS Loaded - Direct Inline Style Test (Green Fresh #7CB342)
        </div>

        <div className="bg-green-fresh" style={{
          backgroundColor: '#7CB342',
          padding: '20px',
          borderRadius: '8px',
          color: 'white',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          🎨 Tailwind Class Test - This should be green if bg-green-fresh works
        </div>

        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="font-accent text-green-forest mb-4" style={{ fontSize: '3.5rem', fontWeight: 600 }}>
            Teman Tanam Design System
          </h1>
          <p className="text-lg text-gray-600 font-sans">
            Testing Tailwind CSS v4 with Custom Design Tokens
          </p>
        </header>

        {/* Color Palette */}
        <section className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-green-forest mb-6">
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-green-fresh h-20 rounded-md mb-2" style={{ backgroundColor: 'var(--color-green-fresh)' }}></div>
              <p className="text-sm text-gray-600">Green Fresh</p>
              <p className="text-xs text-gray-400">#7CB342</p>
            </div>
            <div className="text-center">
              <div className="bg-green-forest h-20 rounded-md mb-2" style={{ backgroundColor: 'var(--color-green-forest)' }}></div>
              <p className="text-sm text-gray-600">Green Forest</p>
              <p className="text-xs text-gray-400">#2D5016</p>
            </div>
            <div className="text-center">
              <div className="bg-brown-earth h-20 rounded-md mb-2" style={{ backgroundColor: 'var(--color-brown-earth)' }}></div>
              <p className="text-sm text-gray-600">Brown Earth</p>
              <p className="text-xs text-gray-400">#8B4513</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-sky h-20 rounded-md mb-2" style={{ backgroundColor: 'var(--color-blue-sky)' }}></div>
              <p className="text-sm text-gray-600">Blue Sky</p>
              <p className="text-xs text-gray-400">#87CEEB</p>
            </div>
          </div>

          {/* Direct color test for verification */}
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <p className="text-sm font-medium mb-2">Direct Color Test (using inline styles):</p>
            <div className="flex gap-2">
              <div className="w-16 h-16 rounded" style={{ backgroundColor: '#7CB342' }} title="Direct #7CB342"></div>
              <div className="w-16 h-16 rounded" style={{ backgroundColor: '#2D5016' }} title="Direct #2D5016"></div>
              <div className="w-16 h-16 rounded" style={{ backgroundColor: '#8B4513' }} title="Direct #8B4513"></div>
              <div className="w-16 h-16 rounded" style={{ backgroundColor: '#87CEEB' }} title="Direct #87CEEB"></div>
            </div>
          </div>
        </section>

        {/* Typography Scale */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-green-forest mb-6">
            Typography Scale
          </h2>

          {/* Inter Font (Main/Body) */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-green-fresh mb-4">Inter Font (font-sans) - Body Text</h3>
            <div className="space-y-3 font-sans">
              <p className="text-xs text-gray-800">Extra Small (12px) - text-xs</p>
              <p className="text-sm text-gray-800">Small (14px) - text-sm</p>
              <p className="text-base text-gray-800">Base (16px) - text-base</p>
              <p className="text-lg text-gray-800">Large (18px) - text-lg</p>
              <p className="text-xl text-gray-800">Extra Large (20px) - text-xl</p>
              <p className="text-2xl text-gray-800">2XL (24px) - text-2xl</p>
              <p className="text-3xl text-gray-800">3XL (32px) - text-3xl</p>
            </div>
          </div>

          {/* Caveat Font (Accent/Handwritten) */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-medium text-green-fresh mb-4 font-sans">Caveat Font (font-accent) - Handwritten Personality</h3>
            <div className="space-y-3 font-accent">
              <p className="text-lg text-gray-800">Welcome to Teman Tanam! 🌱</p>
              <p className="text-xl text-green-fresh">Your plants are happy today</p>
              <p className="text-2xl text-green-forest">Time to water your garden</p>
              <p className="text-3xl text-brown-earth" style={{ fontSize: '2.5rem' }}>Let's grow together!</p>
              <p className="text-gray-600" style={{ fontSize: '3rem' }}>Teman Tanam</p>
            </div>
          </div>

          {/* Usage Example */}
          <div className="mt-8 p-4 bg-cream rounded-md">
            <p className="font-sans text-sm text-gray-600 mb-2"><strong>Usage Guide:</strong></p>
            <ul className="font-sans text-sm text-gray-600 space-y-1">
              <li>• <code className="bg-gray-200 px-2 py-1 rounded">font-sans</code> → Inter (body text, UI elements)</li>
              <li>• <code className="bg-gray-200 px-2 py-1 rounded">font-accent</code> → Caveat (headings, personality moments)</li>
            </ul>
          </div>
        </section>

        {/* Spacing System */}
        <section className="bg-white p-6 rounded-md shadow-sm">
          <h2 className="text-2xl font-semibold text-green-forest mb-6">
            Spacing System (4px base)
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="bg-green-fresh p-1 rounded-sm">
                <span className="text-xs text-white">p-1 (4px)</span>
              </div>
              <div className="bg-green-fresh p-2 rounded-sm">
                <span className="text-xs text-white">p-2 (8px)</span>
              </div>
              <div className="bg-green-fresh p-4 rounded-sm">
                <span className="text-xs text-white">p-4 (16px)</span>
              </div>
              <div className="bg-green-fresh p-6 rounded-sm">
                <span className="text-xs text-white">p-6 (24px)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Border Radius */}
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-green-forest mb-6">
            Border Radius
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="bg-blue-sky p-4 rounded-sm">
              <span className="text-sm text-gray-800">rounded-sm (4px)</span>
            </div>
            <div className="bg-blue-sky p-4 rounded-md">
              <span className="text-sm text-gray-800">rounded-md (8px)</span>
            </div>
            <div className="bg-blue-sky p-4 rounded-lg">
              <span className="text-sm text-gray-800">rounded-lg (12px)</span>
            </div>
            <div className="bg-blue-sky p-4 rounded-xl">
              <span className="text-sm text-gray-800">rounded-xl (16px)</span>
            </div>
            <div className="bg-blue-sky p-4 rounded-full">
              <span className="text-sm text-gray-800">rounded-full</span>
            </div>
          </div>
        </section>

        {/* Shadows */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-green-forest mb-6">
            Shadow System
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
              <p className="text-sm font-medium">shadow-sm</p>
            </div>
            <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
              <p className="text-sm font-medium">shadow-md</p>
            </div>
            <div className="bg-white p-6 rounded-md shadow-lg border border-gray-200">
              <p className="text-sm font-medium">shadow-lg</p>
            </div>
            <div className="bg-white p-6 rounded-md shadow-xl border border-gray-200">
              <p className="text-sm font-medium">shadow-xl</p>
            </div>
          </div>
        </section>

        {/* Button Components */}
        <section className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-green-forest mb-6">
            Button Components
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-green-fresh text-white px-6 py-3 rounded-md shadow-md hover:shadow-lg transition-all duration-base font-medium">
              Primary Button
            </button>
            <button className="bg-green-forest text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-base font-medium">
              Secondary Button
            </button>
            <button className="bg-white text-green-fresh border-2 border-green-fresh px-6 py-3 rounded-md shadow-sm hover:shadow-md transition-all duration-base font-medium">
              Outline Button
            </button>
            <button className="bg-success text-white px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-fast font-medium">
              Success Button
            </button>
          </div>
        </section>

        {/* Semantic Colors */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-green-forest mb-6">
            Semantic Colors
          </h2>
          <div className="space-y-3">
            <div className="bg-success text-white p-4 rounded-md">
              <p className="font-medium">Success Message</p>
            </div>
            <div className="bg-warning text-white p-4 rounded-md">
              <p className="font-medium">Warning Message</p>
            </div>
            <div className="bg-error text-white p-4 rounded-md">
              <p className="font-medium">Error Message</p>
            </div>
            <div className="bg-info text-white p-4 rounded-md">
              <p className="font-medium">Info Message</p>
            </div>
          </div>
        </section>

        {/* Card Example */}
        <section
          className="p-8 rounded-xl shadow-xl text-white"
          style={{
            background: 'linear-gradient(to bottom right, var(--color-green-fresh), var(--color-green-forest))',
            backgroundImage: 'linear-gradient(to bottom right, #7CB342, #2D5016)'
          }}
        >
          <h2 className="font-accent mb-4" style={{ fontSize: '3.5rem', fontWeight: 600 }}>
            Grow with Teman Tanam! 🌿
          </h2>
          <p className="text-lg leading-relaxed mb-6 font-sans">
            This card demonstrates the use of background gradients, custom colors,
            typography (both Inter & Caveat), spacing, border radius, and shadow utilities from our
            design system.
          </p>
          <button
            className="bg-yellow-sun text-green-forest px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all font-accent"
            style={{
              backgroundColor: 'var(--color-yellow-sun)',
              color: 'var(--color-green-forest)',
              fontSize: '1.5rem',
              fontWeight: 600
            }}
          >
            Let's Start Growing!
          </button>
        </section>
      </div>
    </div>
  );
};

export default DesignTokenTest;
