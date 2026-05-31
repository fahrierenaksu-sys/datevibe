/**
 * dummyProfiles – 10 dummy buddies for offline/demo testing.
 *
 * Two profiles (Defne Yıldız and Ceren Aksoy) have `hasLikedMe: true`,
 * meaning swiping right on them will trigger a mutual match.
 */

export interface DummyProfile {
  userId: string
  firstName: string
  lastName: string
  displayName: string
  age: number
  /** Placeholder photo URL — avatar component will use initials when offline */
  photoUrl: string
  bio: string
  distance: number
  hasLikedMe: boolean
}

export const DUMMY_PROFILES: DummyProfile[] = [
  {
    userId: "demo-user-001",
    firstName: "Defne",
    lastName: "Yıldız",
    displayName: "Defne Yıldız",
    age: 24,
    photoUrl: "https://i.pravatar.cc/400?img=1",
    bio: "Kahve tutkunu ☕ Fotoğrafçılık ve seyahat",
    distance: 85,
    hasLikedMe: true
  },
  {
    userId: "demo-user-002",
    firstName: "Ece",
    lastName: "Korkmaz",
    displayName: "Ece Korkmaz",
    age: 27,
    photoUrl: "https://i.pravatar.cc/400?img=5",
    bio: "Yoga instructor 🧘‍♀️ Dog mom",
    distance: 210,
    hasLikedMe: false
  },
  {
    userId: "demo-user-003",
    firstName: "Ceren",
    lastName: "Aksoy",
    displayName: "Ceren Aksoy",
    age: 23,
    photoUrl: "https://i.pravatar.cc/400?img=9",
    bio: "Müzisyen 🎵 Gitar & piyano",
    distance: 45,
    hasLikedMe: true
  },
  {
    userId: "demo-user-004",
    firstName: "Selin",
    lastName: "Demir",
    displayName: "Selin Demir",
    age: 26,
    photoUrl: "https://i.pravatar.cc/400?img=16",
    bio: "Grafik tasarımcı 🎨 Minimalizm hayranı",
    distance: 320,
    hasLikedMe: false
  },
  {
    userId: "demo-user-005",
    firstName: "İrem",
    lastName: "Çelik",
    displayName: "İrem Çelik",
    age: 25,
    photoUrl: "https://i.pravatar.cc/400?img=20",
    bio: "Kitap kurdu 📚 Sci-fi ve felsefe",
    distance: 150,
    hasLikedMe: false
  },
  {
    userId: "demo-user-006",
    firstName: "Irmak",
    lastName: "Arı",
    displayName: "Irmak Arı",
    age: 24,
    photoUrl: "https://i.pravatar.cc/400?img=25",
    bio: "Bilgisayar mühendisi 💻 Startup dünyası",
    distance: 95,
    hasLikedMe: true
  },
  {
    userId: "demo-user-007",
    firstName: "Elif",
    lastName: "Aydın",
    displayName: "Elif Aydın",
    age: 22,
    photoUrl: "https://i.pravatar.cc/400?img=32",
    bio: "Dans 💃 Salsa ve bachata",
    distance: 60,
    hasLikedMe: false
  },
  {
    userId: "demo-user-008",
    firstName: "Buse",
    lastName: "Şahin",
    displayName: "Buse Şahin",
    age: 29,
    photoUrl: "https://i.pravatar.cc/400?img=36",
    bio: "Şef aşçı 🍳 Dünya mutfakları",
    distance: 180,
    hasLikedMe: false
  },
  {
    userId: "demo-user-009",
    firstName: "Melis",
    lastName: "Öztürk",
    displayName: "Melis Öztürk",
    age: 24,
    photoUrl: "https://i.pravatar.cc/400?img=41",
    bio: "Fitness & outdoor 🏃‍♀️ Doğa yürüyüşü",
    distance: 270,
    hasLikedMe: false
  },
  {
    userId: "demo-user-010",
    firstName: "Ayşe",
    lastName: "Yılmaz",
    displayName: "Ayşe Yılmaz",
    age: 26,
    photoUrl: "https://i.pravatar.cc/400?img=47",
    bio: "Avukat ⚖️ İnsan hakları",
    distance: 130,
    hasLikedMe: false
  }
]

export const DEMO_CURRENT_USER = {
  userId: "demo-me-001",
  displayName: "Sen",
  age: 25
}

/** Get profiles that have liked the current user */
export function getProfilesWhoLikedMe(): DummyProfile[] {
  return DUMMY_PROFILES.filter((p) => p.hasLikedMe)
}

/** Check if swiping right on this user should trigger a match */
export function shouldTriggerMatch(userId: string): boolean {
  const profile = DUMMY_PROFILES.find((p) => p.userId === userId)
  return profile?.hasLikedMe === true
}
