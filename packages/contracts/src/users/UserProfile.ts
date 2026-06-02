import type { AvatarSelection } from "../avatar/AvatarSelection";

export interface UserProfile {
  userId: string;
  displayName: string;
  avatar: AvatarSelection;
  age?: number;
}
