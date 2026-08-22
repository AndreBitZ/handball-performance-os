export type DataSource = 'MATCH_SHEET' | 'MANUAL_STATS' | 'ANDEBOL_STATS' | 'VIDEO';
export type DataQualityLevel = 0 | 1 | 2 | 3;
export type DataQuality = { level: DataQualityLevel; source: DataSource; knownFields: string[]; unknownFields: string[]; validatedAt?: string };

export const QUALITY_LEVELS: Record<DataQualityLevel, string> = {
  0: 'Ficha de jogo',
  1: 'Estatística manual',
  2: 'Andebol-Stats',
  3: 'Vídeo'
};

export function qualityForSource(source: DataSource): DataQualityLevel {
  return source === 'VIDEO' ? 3 : source === 'ANDEBOL_STATS' ? 2 : source === 'MANUAL_STATS' ? 1 : 0;
}
