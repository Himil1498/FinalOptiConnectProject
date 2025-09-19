import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { sampleIndianTowers } from "../../data/sampleTowers";

export interface TelecomTower {
  id: string;
  name: string;
  position: [number, number];
  type: "cell" | "fiber" | "radio" | "satellite";
  status: "active" | "inactive" | "maintenance" | "critical";
  signal_strength: number;
  coverage_radius: number;
  installed_date: string;
  last_maintenance: string;
  equipment: string[];
}

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: "towers" | "coverage" | "fiber" | "boundaries";
  opacity: number;
}

interface MapState {
  center: [number, number];
  zoom: number;
  towers: TelecomTower[];
  selectedTower: TelecomTower | null;
  layers: MapLayer[];
  loading: boolean;
  error: string | null;
  drawingMode: boolean;
  measurementMode: boolean;
}

const initialState: MapState = {
  center: [20.5937, 78.9629], // Center of India
  zoom: 5,
  towers: sampleIndianTowers,
  selectedTower: null,
  layers: [
    {
      id: "towers",
      name: "Telecom Towers",
      visible: true,
      type: "towers",
      opacity: 1
    },
    {
      id: "coverage",
      name: "Coverage Areas",
      visible: true,
      type: "coverage",
      opacity: 0.6
    },
    {
      id: "fiber",
      name: "Fiber Networks",
      visible: false,
      type: "fiber",
      opacity: 0.8
    },
    {
      id: "boundaries",
      name: "India Boundary",
      visible: true,
      type: "boundaries",
      opacity: 0.8
    }
  ],
  loading: false,
  error: null,
  drawingMode: false,
  measurementMode: false
};

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setMapCenter: (state, action: PayloadAction<[number, number]>) => {
      state.center = action.payload;
    },
    setMapZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    setTowers: (state, action: PayloadAction<TelecomTower[]>) => {
      state.towers = action.payload;
    },
    addTower: (state, action: PayloadAction<TelecomTower>) => {
      state.towers.push(action.payload);
    },
    updateTower: (state, action: PayloadAction<TelecomTower>) => {
      const index = state.towers.findIndex(
        (tower) => tower.id === action.payload.id
      );
      if (index !== -1) {
        state.towers[index] = action.payload;
      }
    },
    removeTower: (state, action: PayloadAction<string>) => {
      state.towers = state.towers.filter(
        (tower) => tower.id !== action.payload
      );
    },
    setSelectedTower: (state, action: PayloadAction<TelecomTower | null>) => {
      state.selectedTower = action.payload;
    },
    toggleLayer: (state, action: PayloadAction<string>) => {
      const layer = state.layers.find((l) => l.id === action.payload);
      if (layer) {
        layer.visible = !layer.visible;
      }
    },
    setLayerOpacity: (
      state,
      action: PayloadAction<{ layerId: string; opacity: number }>
    ) => {
      const layer = state.layers.find((l) => l.id === action.payload.layerId);
      if (layer) {
        layer.opacity = action.payload.opacity;
      }
    },
    toggleDrawingMode: (state) => {
      state.drawingMode = !state.drawingMode;
      if (state.drawingMode) {
        state.measurementMode = false;
      }
    },
    toggleMeasurementMode: (state) => {
      state.measurementMode = !state.measurementMode;
      if (state.measurementMode) {
        state.drawingMode = false;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  }
});

export const {
  setMapCenter,
  setMapZoom,
  setTowers,
  addTower,
  updateTower,
  removeTower,
  setSelectedTower,
  toggleLayer,
  setLayerOpacity,
  toggleDrawingMode,
  toggleMeasurementMode,
  setLoading,
  setError
} = mapSlice.actions;

export default mapSlice.reducer;
