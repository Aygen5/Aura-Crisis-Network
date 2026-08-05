export interface DistrictRiskDto {
  id: string;
  districtName: string;
  seismicRisk: number;
  floodRisk: number;
  landslideRisk: number;
  wildfireRisk: number;
  lastCalculatedAt: string;
}
