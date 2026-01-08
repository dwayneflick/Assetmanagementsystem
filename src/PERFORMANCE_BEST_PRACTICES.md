# Performance Best Practices - Quick Reference

This guide helps you maintain optimal performance as you continue developing the Asset Management System.

## 🚀 Quick Wins

### 1. When Adding New Components
```typescript
// ✅ DO: Export as memoized component
import { memo } from 'react';

const MyComponent = memo(({ data }) => {
  // component code
});

export default MyComponent;

// ❌ DON'T: Regular export without memoization
export default function MyComponent({ data }) {
  // component code
}
```

### 2. When Adding New Pages/Modules
```typescript
// ✅ DO: Use lazy loading in App.tsx
const NewModule = lazy(() => import('./components/NewModule'));

// ❌ DON'T: Direct import
import NewModule from './components/NewModule';
```

### 3. When Creating Event Handlers
```typescript
// ✅ DO: Use useCallback
const handleClick = useCallback(() => {
  // handler code
}, [dependencies]);

// ❌ DON'T: Define inline in JSX
<button onClick={() => doSomething()} />
```

### 4. When Doing Expensive Calculations
```typescript
// ✅ DO: Use useMemo
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);

// ❌ DON'T: Calculate in render
const filteredData = data.filter(item => item.active);
```

### 5. When Adding Search Fields
```typescript
// ✅ DO: Use debounce utility
import { debounce } from '../utils/performance';

const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    performSearch(term);
  }, 300),
  []
);

// Use in onChange
<input onChange={(e) => debouncedSearch(e.target.value)} />

// ❌ DON'T: Direct API calls on every keystroke
<input onChange={(e) => performSearch(e.target.value)} />
```

## 📊 When to Use What

### useMemo - For Expensive Computations
Use when:
- Filtering large arrays
- Complex calculations
- Creating objects/arrays for props
- Chart data generation

```typescript
const chartData = useMemo(() => {
  return data.map(item => ({
    name: item.name,
    value: calculateValue(item)
  }));
}, [data]);
```

### useCallback - For Event Handlers
Use when:
- Passing callbacks to child components
- Event handlers that are dependencies
- Functions used in useEffect dependencies

```typescript
const handleSave = useCallback(async (item) => {
  await saveItem(item);
  refreshData();
}, [refreshData]);
```

### React.memo - For Components
Use when:
- Component receives same props frequently
- Component is expensive to render
- Parent re-renders often but child doesn't need to

```typescript
const ExpensiveComponent = memo(({ data, onAction }) => {
  // expensive rendering logic
});
```

## 🎯 Common Performance Issues

### Issue 1: Slow List Rendering
**Problem**: Rendering 100+ items in a table/list
**Solution**: 
```typescript
// Option A: Pagination
const pageSize = 20;
const paginatedData = data.slice(
  (page - 1) * pageSize,
  page * pageSize
);

// Option B: Virtual scrolling (for very large lists)
// Use react-window or similar library
```

### Issue 2: Search Causing Lag
**Problem**: Search fires on every keystroke
**Solution**:
```typescript
import { debounce } from '../utils/performance';

const debouncedSearch = useMemo(
  () => debounce(performSearch, 300),
  []
);
```

### Issue 3: Heavy API Calls on Navigation
**Problem**: Same data fetched multiple times
**Solution**:
```typescript
import { memoryCache } from '../utils/performance';

const fetchData = async () => {
  const cached = memoryCache.get('key');
  if (cached) return cached;
  
  const data = await api.fetch();
  memoryCache.set('key', data, 5 * 60 * 1000); // 5 min
  return data;
};
```

### Issue 4: Component Re-renders Too Often
**Problem**: Component updates when it doesn't need to
**Solution**:
```typescript
// Check what's causing re-renders
useEffect(() => {
  console.log('Component rendered');
});

// Add React.memo with custom comparison if needed
export default memo(Component, (prevProps, nextProps) => {
  // Return true if props are equal (skip render)
  return prevProps.id === nextProps.id;
});
```

## 🔍 Debugging Performance

### Chrome DevTools Performance Tab
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Interact with your app
5. Stop recording
6. Look for:
   - Long tasks (yellow)
   - Rendering time
   - Function calls

### React DevTools Profiler
1. Install React DevTools extension
2. Open Profiler tab
3. Click Record
4. Interact with your app
5. Stop and analyze:
   - Which components rendered
   - How long each took
   - Why they rendered

### Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Check:
   - Bundle sizes
   - Load times
   - Duplicate requests
   - Large payloads

## 📝 Checklist for New Features

Before deploying:
- [ ] Used React.memo for new components?
- [ ] Used useCallback for event handlers?
- [ ] Used useMemo for calculations?
- [ ] Added debouncing to search fields?
- [ ] Lazy-loaded new page components?
- [ ] Tested on slow 3G network?
- [ ] Checked bundle size impact?
- [ ] Verified no console errors?

## 🎓 Learn More

### Official Documentation
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [useMemo Hook](https://react.dev/reference/react/useMemo)
- [useCallback Hook](https://react.dev/reference/react/useCallback)
- [React.memo](https://react.dev/reference/react/memo)

### Tools
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

Remember: **Premature optimization is the root of all evil**. Focus on correctness first, then optimize the slow parts based on actual measurements.
