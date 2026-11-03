import React from 'react';
import { NavLink } from 'react-router-dom';
import { Radio, Heart, Settings } from 'lucide-react';

const links = [
  { to: '/', label: 'Início', icon: Radio, end: true },
  { to: '/favorites', label: 'Favoritos', icon: Heart },
];

export const DesktopSidebar: React.FC = () => (
  <aside className="desktop-sidebar hidden md:flex">
    <NavLink to="/" className="sidebar-brand" aria-label="Radio Finder — início">
      <span className="sidebar-brand-mark"><Radio size={19} strokeWidth={2.2} /></span>
      <span>radio<span>finder</span></span>
    </NavLink>

    <div className="sidebar-section-label">Biblioteca</div>
    <nav className="sidebar-nav" aria-label="Navegação principal">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}>
          <Icon size={18} strokeWidth={1.9} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>

    <div className="sidebar-spacer" />
    <div className="sidebar-divider" />
    <NavLink to="/settings" className={({ isActive }) => `sidebar-utility${isActive ? ' is-active' : ''}`}>
      <Settings size={16} /><span>Ajustes</span>
    </NavLink>
    <div className="sidebar-caption">Sua rádio. Seu lugar.</div>
  </aside>
);
