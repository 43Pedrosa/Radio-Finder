/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AudioPlayerProvider, useAudioPlayer } from './contexts/AudioPlayerContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useLocation } from './hooks/useLocation';
import { useWeather } from './hooks/useWeather';
import { Header } from './components/layout/Header';
import { PersistentPlayer } from './components/player/PersistentPlayer';
import { MobileNav } from './components/layout/MobileNav';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { HomePage } from './pages/Home/HomePage';
import { FavoritesPage } from './pages/Favorites/FavoritesPage';
import { ExplorePage } from './pages/Explore/ExplorePage';
import { AdminPage } from './pages/Admin/AdminPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

function AppContent() {
  const { coords, geocoded, radiusMeters, loading: locationLoading, isManualSelection, requestGpsLocation } = useLocation();
  const { weather, loading: weatherLoading } = useWeather(coords);
  const { currentStation } = useAudioPlayer();

  return (
    <div className="app-shell min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex font-sans transition-colors selection:bg-rose-500/15 selection:text-rose-600 dark:selection:text-rose-300">
      <DesktopSidebar />
      <div className="app-main min-w-0 flex min-h-screen flex-1 flex-col">
      {/* Brand, selected location, live weather and theme control */}
      <Header
        coords={coords}
        location={geocoded}
        locationLoading={locationLoading}
        isManualSelection={isManualSelection}
        weather={weather}
        weatherLoading={weatherLoading}
        onUseCurrentLocation={requestGpsLocation}
      />

      {/* Main Content Area */}
      <main className={`flex-1 ${currentStation ? 'pb-[calc(160px+env(safe-area-inset-bottom,0px))] md:pb-24' : 'pb-16 md:pb-8'}`}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                coords={coords}
                geocoded={geocoded}
                radiusMeters={radiusMeters}
                locationLoading={locationLoading}
              />
            }
          />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Discrete subtle footer link to administration if needed */}
      <footer className="py-5 text-center text-[11px] text-slate-400 dark:text-slate-600 transition-colors">
        <Link
          to="/admin"
          className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
        >
          Painel Admin
        </Link>
      </footer>

      {/* Compact Persistent Audio Player (renders only when audio is active) */}
      <MobileNav playerActive={Boolean(currentStation)} />
      <PersistentPlayer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AudioPlayerProvider>
          <AppContent />
        </AudioPlayerProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
