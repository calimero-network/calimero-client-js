# CalimeroProvider registryUrl Prop

**Added:** 2025-11-04  
**Status:** ✅ Prop Added (Not Yet Implemented)

---

## 📝 New Prop

### `registryUrl?: string`

**Purpose:** Allow applications to specify which registry to use for fetching package manifests.

**Default:** `https://mero-registry.vercel.app/api` (production registry)

**Usage:**
```typescript
<CalimeroProvider
  packageName="network.calimero.meropass"
  registryUrl="http://localhost:8082"  // ← NEW: Override for local development
  mode={AppMode.MultiContext}
>
  {children}
</CalimeroProvider>
```

---

## 🎯 Use Cases

### Production (Default)
```typescript
<CalimeroProvider
  packageName="network.calimero.meropass"
  mode={AppMode.MultiContext}
>
```
→ Uses: `https://mero-registry.vercel.app/api`

### Local Development
```typescript
<CalimeroProvider
  packageName="network.calimero.meropass"
  registryUrl="http://localhost:8082"  // ← Override
  mode={AppMode.MultiContext}
>
```
→ Uses: `http://localhost:8082`

### Custom Registry
```typescript
<CalimeroProvider
  packageName="my.custom.app"
  registryUrl="https://my-registry.example.com/api"
  mode={AppMode.MultiContext}
>
```
→ Uses: `https://my-registry.example.com/api`

---

## ⏳ TODO: Implementation

The prop is added but not yet used. Next steps:

1. Pass `registryUrl` to auth URL as query parameter
2. Auth frontend reads and uses it
3. Falls back to default if not provided

**Implementation location:**
```typescript
// In CalimeroProvider login flow:
const authUrl = `${authEndpoint}/login?package-name=${packageName}&registry-url=${registryUrl || defaultRegistry}&...`;
```

---

## 📚 Documentation

**Added to CalimeroProviderProps:**
```typescript
/**
 * Optional registry URL for fetching package manifests
 * Defaults to production registry (https://mero-registry.vercel.app/api)
 * Override for development/testing (e.g., 'http://localhost:8082')
 * Used only when packageName is provided
 */
registryUrl?: string;
```

---

**Next:** Wire it through to the auth URL construction
