import React from 'react';
import { LocalMarketMap } from './LocalMarketMap';
import { Language } from '../types';

interface Props {
  language: Language;
  initialVillage?: string;
  initialDistrict?: string;
  initialCategory?: string;
  initialLat?: number;
  initialLon?: number;
  initialRadius?: number;
  onLocationSelect?: (lat: number, lon: number, villageName: string, districtName: string) => void;
  hideHeaderControls?: boolean;
  hideKpiCards?: boolean;
  hideOutletList?: boolean;
  mapHeight?: string;
}

/**
 * GoogleMarketMap
 * Uses high-performance OpenStreetMap / Leaflet mapping engine (LocalMarketMap)
 * to guarantee 100% uptime, zero API key/billing restrictions, and sharp 5km/10km catchment visualization.
 */
export const GoogleMarketMap: React.FC<Props> = (props) => {
  return <LocalMarketMap {...props} />;
};

export default GoogleMarketMap;
