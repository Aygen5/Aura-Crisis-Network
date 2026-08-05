import { httpClient } from "@/lib/http-client";
import type { EventDto } from "@/types";

export const eventsService = {
  async getActiveEvents(): Promise<EventDto[]> {
    return httpClient<EventDto[]>("/events");
  },

  async getEventsByBoundingBox(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number
  ): Promise<EventDto[]> {
    return httpClient<EventDto[]>(`/events/bounding-box?minLat=${minLat}&minLng=${minLng}&maxLat=${maxLat}&maxLng=${maxLng}`);
  },

  async getEventById(id: string): Promise<EventDto> {
    return httpClient<EventDto>(`/events/${id}`);
  },

  async escalateEvent(id: string): Promise<void> {
    await httpClient<void>(`/events/${id}/escalate`, { method: "POST" });
  }
};
