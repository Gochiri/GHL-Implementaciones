<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(true)

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`
  },
  {
    path: '/kanban',
    label: 'Tareas',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 11 3 3L22 4"/></svg>`
  },
  {
    path: '/analyzer',
    label: 'Analizador',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>`
  },
  {
    path: '/projects',
    label: 'Proyectos',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`
  },
  {
    path: '/settings',
    label: 'Configuración',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0"/><path d="M12 2v2m0 18v2M2 12h2m18 0h2"/><path d="m4.22 4.22 1.42 1.42m12.72 12.72 1.42 1.42m0-16.56-1.42 1.42M5.64 18.36l-1.42 1.42"/></svg>`
  }
]

const isActive = (path) => route.path === path
</script>

<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: !sidebarOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
          </span>
          <span class="logo-text" v-if="sidebarOpen">GHL Assistant</span>
        </div>
        <button class="toggle-btn" @click="sidebarOpen = !sidebarOpen" :title="sidebarOpen ? 'Colapsar' : 'Expandir'">
          <svg v-if="sidebarOpen" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          :title="!sidebarOpen ? item.label : ''"
        >
          <span class="nav-icon" v-html="item.svg"></span>
          <span class="nav-label" v-if="sidebarOpen">{{ item.label }}</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer" v-if="sidebarOpen">
        <div class="version">v1.0.0</div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-header">
        <h1 class="page-title">{{ route.meta.title || 'GHL Implementation Assistant' }}</h1>
        <div class="header-actions">
          <span class="status-badge online">● Conectado</span>
        </div>
      </header>
      
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

/* Reset & Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Colors - Deep Luxury Palette */
  --bg-dark: #020205;
  --bg-card: rgba(13, 13, 23, 0.7);
  --bg-hover: rgba(30, 30, 50, 0.8);
  --bg-elevated: rgba(20, 20, 35, 0.9);
  
  /* Glassmorphism */
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-bg: rgba(10, 10, 20, 0.6);
  --glass-blur: blur(12px);

  /* Colors - Brand Neon/Luxury */
  --primary: #8b5cf6;
  --primary-light: #a78bfa;
  --primary-dark: #6d28d9;
  --accent: #06b6d4;
  --accent-light: #22d3ee;
  --glow-primary: 0 0 20px rgba(139, 92, 246, 0.4);
  --glow-accent: 0 0 20px rgba(6, 182, 212, 0.4);

  /* Colors - Semantic */
  --success: #10b981;
  --success-light: #34d399;
  --warning: #f59e0b;
  --warning-light: #fbbf24;
  --danger: #ef4444;
  --danger-light: #f87171;
  --info: #3b82f6;

  /* Colors - Text (Premium contrast) */
  --text: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --text-disabled: #334155;

  /* Colors - Border */
  --border: rgba(255, 255, 255, 0.1);
  --border-light: rgba(255, 255, 255, 0.15);
  --border-focus: var(--primary);

  /* Typography - Custom Premium Pair */
  --font-family: 'Instrument Sans', system-ui, sans-serif;
  --font-display: 'Outfit', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 3rem;
  --text-5xl: 4.5rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.5);
  --shadow-md: 0 8px 16px rgba(0,0,0,0.6);
  --shadow-lg: 0 16px 32px rgba(0,0,0,0.7);
  --shadow-glow: 0 0 30px rgba(139, 92, 246, 0.2);

  /* Layout */
  --sidebar-width: 280px;
  --sidebar-collapsed: 80px;
  --header-height: 80px;
}

body {
  font-family: var(--font-family);
  font-size: var(--text-base);
  background: var(--bg-dark);
  color: var(--text);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* Noise Texture Overlay */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
  z-index: 9999;
}

/* App Layout */
.app-container {
  display: flex;
  min-height: 100vh;
}

/* Sidebar - Premium Glassmorphism */
.sidebar {
  width: var(--sidebar-width);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-right: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  height: 100vh;
  z-index: 100;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed);
}

.sidebar-header {
  height: var(--header-height);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--glass-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  font-size: 32px;
}

.logo-text {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(to right, #fff, var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.sidebar-nav {
  flex: 1;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
}

.nav-icon {
  font-size: 20px;
  min-width: 24px;
}

.sidebar-footer {
  padding: 24px;
  border-top: 1px solid var(--glass-border);
}

.version {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed + .main-content {
  margin-left: var(--sidebar-collapsed);
}

.top-header {
  height: var(--header-height);
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(2, 2, 5, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--glass-border);
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #fff;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.status-badge.online {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-light);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.page-content {
  padding: 40px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

/* ==========================================
   Utility Classes - Premium Cards
   ========================================== */

.card {
  background: var(--bg-card);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 32px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

/* ==========================================
   Utility Classes - Luxury Buttons
   ========================================== */

.btn {
  font-family: var(--font-display);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.01em;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: var(--shadow-glow);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-light);
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(139, 92, 246, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text);
}

.btn-danger {
  background: linear-gradient(135deg, var(--danger) 0%, var(--danger-light) 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), 0 0 20px rgba(255, 118, 117, 0.3);
}

.btn-success {
  background: linear-gradient(135deg, var(--success) 0%, var(--success-light) 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), 0 0 20px rgba(0, 184, 148, 0.3);
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-xs);
  border-radius: var(--radius-md);
}

.btn-lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-base);
  border-radius: var(--radius-xl);
}

/* Button with icon only */
.btn-icon {
  padding: var(--space-2);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
}

/* Outline variant */
.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.btn-outline:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary-light);
}

/* ==========================================
   Utility Classes - Inputs
   ========================================== */

.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--text);
  font-size: var(--text-sm);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.input::placeholder {
  color: var(--text-disabled);
}

.input:hover:not(:disabled):not(:focus) {
  border-color: var(--border-light);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: var(--focus-ring);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-hover);
}

textarea.input {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

/* ==========================================
   Accessibility - Focus States
   ========================================== */

/* Global focus visible styles */
:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Button focus */
.btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.btn-primary:focus-visible {
  box-shadow: var(--focus-ring), 0 6px 20px rgba(108, 92, 231, 0.4);
}

/* Nav item focus */
.nav-item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Toggle button focus */
.toggle-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Skip to main content link (screen reader) */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  z-index: var(--z-tooltip);
  transition: top var(--transition-fast);
}

.skip-link:focus {
  top: 0;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ==========================================
   Reduced Motion Support
   ========================================== */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .sidebar {
    transition: none;
  }

  .main-content {
    transition: none;
  }

  .btn:hover {
    transform: none;
  }

  .stat-card:hover,
  .action-card:hover {
    transform: none;
  }
}

/* ==========================================
   High Contrast Mode Support
   ========================================== */

@media (prefers-contrast: high) {
  :root {
    --border: #4d4d6a;
    --text-muted: #c0c0d0;
  }

  .btn {
    border: 2px solid currentColor;
  }

  .card {
    border-width: 2px;
  }
}

/* ==========================================
   Typography Helpers
   ========================================== */

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 700;
}

/* Scrollbar Customization */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-dark);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}
</style>
