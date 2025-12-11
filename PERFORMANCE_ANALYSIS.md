# Performance Analysis Report - Teman Tanam

**Date:** December 11, 2025
**Analyzed by:** Claude Code

## Executive Summary

This report identifies performance anti-patterns, unnecessary re-renders, and inefficient patterns in the Teman Tanam codebase. The application is a React/Next.js plant care companion app with potential performance bottlenecks that could impact user experience, especially on mobile devices.

---

## Critical Issues

### 1. Missing Memoization (useMemo/useCallback)

**Location:** `components/Home.jsx`

| Issue | Line | Impact |
|-------|------|--------|
| `filteredPlants` recalculated every render | 197-201 | High - filters 12+ items on every state change |
| `showActionToastWithMessage` recreated | 92-96 | Medium - new function reference each render |
| `handlePlantMenuAction` recreated | 304-348 | Medium - new function reference each render |
| Long press handlers recreated | 289-302 | High - causes child re-renders |

**Current Code:**
```jsx
// Home.jsx:197-201 - Runs on EVERY render
const filteredPlants = plants.filter((plant) => {
  const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesLocation = selectedLocation === 'Semua' || plant.location === selectedLocation;
  return matchesSearch && matchesLocation;
});
```

**Recommended Fix:**
```jsx
const filteredPlants = useMemo(() =>
  plants.filter((plant) => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'Semua' || plant.location === selectedLocation;
    return matchesSearch && matchesLocation;
  }),
  [plants, searchQuery, selectedLocation]
);
```

---

### 2. Excessive State Variables in Single Component

**Location:** `components/Home.jsx:39-90`

The Home component has **25+ useState calls**, causing:
- Complex dependency tracking
- Potential cascading re-renders
- Difficult maintenance

**State Count Breakdown:**
- UI state (modals, menus, toasts): 15+
- Data state (plants, locations, user): 5+
- Form state (search, selected items): 3+

**Recommended Refactoring:**

Option A - Custom Hooks:
```jsx
// hooks/useModalState.js
export const useModalState = () => {
  const [modals, setModals] = useState({
    showAddPlant: false,
    showProfileModal: false,
    showLocationSettings: false,
    showEditProfile: false,
    showAddLocationModal: false,
    showEditPlantModal: false,
    showDiagnosaHamaModal: false,
  });

  const openModal = useCallback((name) =>
    setModals(prev => ({ ...prev, [name]: true })), []);
  const closeModal = useCallback((name) =>
    setModals(prev => ({ ...prev, [name]: false })), []);

  return { modals, openModal, closeModal };
};
```

Option B - useReducer:
```jsx
const initialState = {
  plants: MOCK_PLANTS,
  selectedLocation: 'Semua',
  searchQuery: '',
  modals: { /* ... */ },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'OPEN_MODAL':
      return { ...state, modals: { ...state.modals, [action.name]: true } };
    // ...
  }
}
```

---

### 3. Inline Style Objects Creating New References

**Affected:** All components

Every render creates new style objects, triggering unnecessary reconciliation:

```jsx
// Home.jsx:437-445 - New object every render
<div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#FAFAFA',
}} />
```

**Recommended Fix:**

Option A - Extract to constants:
```jsx
// Outside component
const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FAFAFA',
  },
};

// In component
<div style={styles.container} />
```

Option B - Use CSS Modules or Tailwind (already available):
```jsx
<div className="fixed inset-0 bg-gray-50" />
```

---

### 4. Inline Event Handlers Causing Child Re-renders

**Location:** `components/Home.jsx:761-778`

```jsx
// Current - Creates new functions every render
{filteredPlants.map((plant) => (
  <motion.div
    onClick={() => handlePlantClick(plant)}
    onTouchStart={(e) => handleLongPressStart(plant, e)}
    onMouseDown={(e) => handleLongPressStart(plant, e)}
  />
))}
```

**Recommended Fix:**
```jsx
// Memoize handlers
const handleClick = useCallback((e) => {
  const plantId = e.currentTarget.dataset.plantId;
  const plant = plants.find(p => p.id === plantId);
  if (plant) handlePlantClick(plant);
}, [plants]);

// Use data attributes
<motion.div
  data-plant-id={plant.id}
  onClick={handleClick}
/>
```

---

### 5. Missing React.memo on Child Components

**Affected Components:**
- `SortableLocationCard` (LocationSettings.jsx:28-124)
- All modal components
- Plant card renderings

**Current:**
```jsx
const SortableLocationCard = ({ location, onDelete }) => {...}
```

**Recommended Fix:**
```jsx
const SortableLocationCard = React.memo(({ location, onDelete }) => {...});
```

---

## High Priority Issues

### 6. Unoptimized localStorage Access

**Locations:**
- `Home.jsx:99-106` - Profile data
- `Home.jsx:112-129` - Locations
- `AddPlantForm.jsx:24-45` - Location options
- `LocationSettings.jsx:153-168` - Locations

**Issues:**
1. Multiple components read same localStorage keys independently
2. No caching layer
3. JSON.parse called on every component mount
4. Redundant storage event listeners

**Recommended Fix - Centralized Hook:**
```jsx
// hooks/useLocalStorage.js
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (e) {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  }, [key]);

  return [value, setStoredValue];
}
```

---

### 7. setTimeout Memory Leaks

**Locations:**

| File | Lines | Issue |
|------|-------|-------|
| `Home.jsx` | 95, 317, 323 | Toast timeouts without cleanup |
| `DiagnosaHama.jsx` | 85-94, 147-157 | AI response simulation |
| `PlantDetail.jsx` | 139 | Action toast |

**Current (problematic):**
```jsx
// Home.jsx:95 - No cleanup on unmount
setTimeout(() => setShowActionToast(false), 3000);
```

**Recommended Fix:**
```jsx
const toastTimeoutRef = useRef(null);

const showToast = useCallback((message) => {
  // Clear any existing timeout
  if (toastTimeoutRef.current) {
    clearTimeout(toastTimeoutRef.current);
  }

  setActionToastMessage(message);
  setShowActionToast(true);

  toastTimeoutRef.current = setTimeout(() => {
    setShowActionToast(false);
  }, 3000);
}, []);

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  };
}, []);
```

---

### 8. Unoptimized List Rendering

**Location:** `Home.jsx:761-839`, `PlantDetail.jsx:600-689`

**Issues:**
1. No virtualization for potentially long lists
2. Heavy `motion.div` animations on every list item
3. Images loaded without lazy loading

**Current:**
```jsx
{filteredPlants.map((plant) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}  // Animation runs per item
    animate={{ opacity: 1, scale: 1 }}
  />
))}
```

**Recommendations:**

1. Add lazy loading to images:
```jsx
<img
  src={plant.image}
  alt={plant.name}
  loading="lazy"
  decoding="async"
/>
```

2. Disable initial animations for better performance:
```jsx
<motion.div
  initial={false}  // Skip initial animation
  animate={{ opacity: 1, scale: 1 }}
/>
```

3. Consider virtualization for large lists (50+ items):
```jsx
import { FixedSizeGrid } from 'react-window';
```

---

## Medium Priority Issues

### 9. Object Spread State Updates

**Location:** `AddPlantForm.jsx:57, 72, 85-88`

```jsx
// Current - Creates new object, may trigger unnecessary effects
setFormData({ ...formData, customName: e.target.value });
```

**Better Pattern:**
```jsx
setFormData(prev => ({ ...prev, customName: e.target.value }));
```

---

### 10. Heavy Data Recreation on Every Render

**Location:** `PlantDetail.jsx:83-105`

```jsx
// Recreated on every render
const timeline = [
  { date: '18 Desember 2025', entries: [...] },
  { date: '16 Desember 2025', entries: [...] },
];
```

**Fix:**
```jsx
// Option A: Move outside component (if static)
const MOCK_TIMELINE = [...];

// Option B: Memoize (if depends on props)
const timeline = useMemo(() => [...], [plantData.id]);
```

---

## Performance Impact Summary

| Severity | Issue Count | Key Areas |
|----------|-------------|-----------|
| 🔴 Critical | 5 | Missing memoization, excessive state, inline styles, child re-renders, inline handlers |
| 🟠 High | 3 | setTimeout leaks, unoptimized lists, localStorage access |
| 🟡 Medium | 2 | Object spread, data recreation |

---

## Recommended Action Plan

### Phase 1: Quick Wins (Immediate)
1. ✅ Add `useMemo` to `filteredPlants` in Home.jsx
2. ✅ Add `loading="lazy"` to all `<img>` tags
3. ✅ Add `React.memo` to SortableLocationCard

### Phase 2: Event Handler Optimization (Short-term)
4. Wrap event handlers with `useCallback` in Home.jsx
5. Use data attributes instead of closures for list item handlers
6. Add timeout cleanup with useRef

### Phase 3: Architecture Improvements (Medium-term)
7. Extract inline styles to constants or CSS modules
8. Create centralized localStorage hook
9. Split Home.jsx into smaller components
10. Consider useReducer for complex state

### Phase 4: Advanced Optimization (Long-term)
11. Implement list virtualization if plant count grows
12. Add service worker for offline caching
13. Implement image optimization with Next.js Image component

---

## Tools for Monitoring

1. **React DevTools Profiler** - Identify unnecessary re-renders
2. **Chrome DevTools Performance** - Measure paint/layout times
3. **Lighthouse** - Overall performance scoring
4. **why-did-you-render** - Debug unnecessary re-renders in development

---

## Conclusion

The Teman Tanam application has several performance optimization opportunities, primarily around React rendering patterns. The most impactful fixes are:

1. **Memoizing computed values** (`useMemo` for filteredPlants)
2. **Memoizing callbacks** (`useCallback` for event handlers)
3. **Preventing child re-renders** (`React.memo` on components)
4. **Cleanup patterns** (clearing timeouts on unmount)

These changes should significantly improve the app's responsiveness, especially on lower-end mobile devices.
