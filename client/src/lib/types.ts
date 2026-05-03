export interface RoomDimensions {
  width: number;
  length: number;
  unit: 'm';
}

export interface RoomCoordinates {
  x: number;
  y: number;
}

export type RoomType = 'living_room' | 'kitchen' | 'bedroom' | 'bathroom' | 'dining' | 'office' | 'other';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  dimensions: RoomDimensions;
  coordinates: RoomCoordinates;
  connections: string[];
}

export interface ArchitecturalKernel {
  title: string;
  style_category: string;
  style_seeds: string[];
  rooms: Room[];
  total_area_sqm: number;
  floor_count: number;
}

export type SynthesisStatus = 'queued' | 'synthesizing' | 'completed' | 'failed';

export interface Project {
  id: string;
  user_id: string;
  title: string;
  original_prompt: string;
  kernel_data: ArchitecturalKernel;
  style_category: string;
  style_seeds: string[];
  blueprint_url: string | null;
  status: SynthesisStatus;
  created_at: string;
  updated_at: string;
}

export interface Render {
  id: string;
  room_id: string;
  image_url: string;
  architectural_insights: string[] | null;
  consistency_integrity_score: number | null;
  created_at: string;
}

export interface IkeaItem {
  id: string;
  sku: string;
  name: string;
  series: string;
  price_kwd: number;
  category: string;
  description: string;
  product_url: string;
  image_url: string;
  style_tags: string[];
  match_score?: number;
}

export interface FurnitureSuggestion {
  id: string;
  room_id: string;
  ikea_item_id: string;
  match_confidence: number;
  item: IkeaItem;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  architect_id: string | null;
  bio_design_philosophy: string | null;
  avatar_url: string | null;
  settings: {
    deep_neural_rendering: boolean;
    auto_insight_generation: boolean;
    theme: string;
    synthesis_credits: number;
  };
}

export interface StudioOverview {
  kernels_created: number;
  blueprints_generated: number;
  renders_synthesized: number;
  synthesis_rate: string;
  recent_syntheses: RecentSynthesis[];
}

export interface RecentSynthesis {
  id: string;
  title: string;
  style_category: string;
  status: SynthesisStatus;
  created_at: string;
}

export interface SynthesisInitResponse {
  kernel_id: string;
  project_id: string;
  status: string;
  blueprint_url: string | null;
  style_tokens: string[];
  spatial_kernel: ArchitecturalKernel;
}

export interface RenderRoomResponse {
  render_id: string;
  render_url: string;
  architectural_observations: string[];
  consistency_integrity_score: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    trace_id: string;
  };
}

export interface LibraryItem {
  id: string;
  title: string;
  style_category: string;
  style_seeds: string[];
  created_at: string;
  thumbnail: string | null;
  status: SynthesisStatus;
}
