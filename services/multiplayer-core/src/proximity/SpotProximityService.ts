import type { NearbyUser, PresenceUser, RoomLayout } from "@contracts";
import { getNearbyUsers } from "@domain";
import { SafetyService } from "../safety/SafetyService";

export class SpotProximityService {
  public constructor(private readonly safetyService: SafetyService) {}

  public listNearbyUsers(
    layout: RoomLayout,
    users: readonly PresenceUser[],
    currentUserId: string
  ): NearbyUser[] {
    const blockedInteractionUserIds = this.safetyService.getBlockedInteractionUserIds(currentUserId);
    return getNearbyUsers(layout, users, currentUserId, blockedInteractionUserIds);
  }
}
