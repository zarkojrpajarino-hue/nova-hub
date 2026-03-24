/**
 * useOBVPreviewState — V5.5.1
 * Tab/filter/navigation logic extracted from OBVCenterPreviewModal
 */

import { useState, useMemo } from 'react';
import type { OBV, OBVStatus } from '@/data/obvCenterDemoData';

export interface OBVPreviewFilters {
  status: string;
  owner: string;
  project: string;
  impact: string;
}

export interface OBVPreviewState {
  currentSlide: number;
  setCurrentSlide: (slide: number) => void;
  hoveredOBV: string | null;
  setHoveredOBV: (id: string | null) => void;
  selectedOBV: OBV | null;
  setSelectedOBV: (obv: OBV | null) => void;
  filters: OBVPreviewFilters;
  setFilters: (filters: OBVPreviewFilters) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  newOBV: { title: string; description: string; project: string; impact: string };
  setNewOBV: (obv: { title: string; description: string; project: string; impact: string }) => void;
  totalSlides: number;
  nextSlide: () => void;
  prevSlide: () => void;
  filteredOBVs: OBV[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    atRisk: number;
    totalRevenue: number;
    avgProgress: number;
    completionRate: number;
  };
}

export function useOBVPreviewState(demoOBVs: OBV[]): OBVPreviewState {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoveredOBV, setHoveredOBV] = useState<string | null>(null);
  const [selectedOBV, setSelectedOBV] = useState<OBV | null>(null);
  const [filters, setFilters] = useState<OBVPreviewFilters>({
    status: 'all',
    owner: 'all',
    project: 'all',
    impact: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [newOBV, setNewOBV] = useState({
    title: '',
    description: '',
    project: '',
    impact: 'medium',
  });

  const totalSlides = 7;

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const filteredOBVs = useMemo(() => {
    return demoOBVs.filter((obv) => {
      if (filters.status !== 'all' && obv.status !== filters.status) return false;
      if (filters.owner !== 'all' && obv.owner !== filters.owner) return false;
      if (filters.project !== 'all' && obv.project !== filters.project) return false;
      if (filters.impact !== 'all' && obv.impact !== filters.impact) return false;
      if (searchQuery && !obv.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [demoOBVs, filters, searchQuery]);

  const stats = useMemo(() => ({
    total: demoOBVs.length,
    completed: demoOBVs.filter((o) => o.status === 'completed').length,
    inProgress: demoOBVs.filter((o) => o.status === 'in-progress').length,
    pending: demoOBVs.filter((o) => o.status === 'pending').length,
    atRisk: demoOBVs.filter((o) => o.status === 'at-risk').length,
    totalRevenue: demoOBVs.reduce((sum, o) => sum + o.revenue, 0),
    avgProgress: Math.round(demoOBVs.reduce((sum, o) => sum + o.progress, 0) / demoOBVs.length),
    completionRate: Math.round((demoOBVs.filter((o) => o.status === 'completed').length / demoOBVs.length) * 100),
  }), [demoOBVs]);

  return {
    currentSlide,
    setCurrentSlide,
    hoveredOBV,
    setHoveredOBV,
    selectedOBV,
    setSelectedOBV,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    newOBV,
    setNewOBV,
    totalSlides,
    nextSlide,
    prevSlide,
    filteredOBVs,
    stats,
  };
}
