export default function TestPage() {
  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="max-w-4xl mx-auto space-8">
        {/* Header */}
        <div className="space-4">
          <h1 className="text-3xl font-bold text-forest-green">
            Teman Tanam Design Tokens Test
          </h1>
          <p className="text-lg text-gray-600">
            Testing our custom design system with Tailwind v4
          </p>
        </div>

        {/* Colors */}
        <div className="space-4">
          <h2 className="text-2xl font-semibold text-forest-green">Colors</h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="space-2">
              <div className="h-16 bg-green-fresh rounded-md"></div>
              <p className="text-sm">Green Fresh</p>
            </div>
            <div className="space-2">
              <div className="h-16 bg-forest-green rounded-md"></div>
              <p className="text-sm">Forest Green</p>
            </div>
            <div className="space-2">
              <div className="h-16 bg-brown-earth rounded-md"></div>
              <p className="text-sm">Earth Brown</p>
            </div>
            <div className="space-2">
              <div className="h-16 bg-blue-sky rounded-md"></div>
              <p className="text-sm">Sky Blue</p>
            </div>
            <div className="space-2">
              <div className="h-16 bg-yellow-sun rounded-md"></div>
              <p className="text-sm">Sunshine Yellow</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-4">
          <h2 className="text-2xl font-semibold text-forest-green">Buttons</h2>
          <div className="flex gap-4">
            <button className="bg-green-fresh text-white px-6 py-3 rounded-md shadow-md hover:shadow-lg">
              Primary Button
            </button>
            <button className="bg-cream text-forest-green px-6 py-3 rounded-md border border-forest-green">
              Secondary Button
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="space-4">
          <h2 className="text-2xl font-semibold text-forest-green">Cards</h2>
          <div className="bg-white p-6 rounded-lg shadow-lg space-3">
            <h3 className="text-xl font-semibold">Sample Plant Card</h3>
            <p className="text-gray-600">This demonstrates our design tokens in action.</p>
            <div className="text-sm text-gray-400">Last watered: 2 days ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}