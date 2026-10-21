export type Role = 'ADMIN' | 'ORGANIZER' | 'TEAM_CAPTAIN' | 'PLAYER';

export interface PlayerProfile {
  id: string;
  userId: string;
  ign: string;
  bgmiUid: string;
  primaryRole: 'IGL' | 'ASSAULTER' | 'SUPPORT' | 'SNIPER' | 'ENTRY';
  currentTeamId?: string | null;
  device?: string | null;
  bio?: string | null;
  totalMatches: number;
  totalKills: number;
  totalWins: number;
  mvpCount: number;
  currentTeam?: {
    id: string;
    name: string;
    tag: string;
    logo?: string | null;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  avatar?: string | null;
  phone?: string | null;
  isActive?: boolean;
  organizerStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  organizerBio?: string | null;
  organizerApprovedAt?: string | null;
  playerProfile?: PlayerProfile | null;
  captainedTeams?: Team[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  playerId: string;
  role: 'CAPTAIN' | 'STARTER' | 'SUBSTITUTE';
  status: 'ACTIVE' | 'INVITED';
  player: PlayerProfile;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo?: string | null;
  description?: string | null;
  captainId: string;
  captain?: {
    id: string;
    username: string;
    email?: string;
  };
  members?: TeamMember[];
  rank?: number;
  totalPoints?: number;
  wwcdCount?: number;
  placementPoints?: number;
  killPoints?: number;
  _count?: {
    registrations: number;
    teamResults: number;
  };
}

export interface Tournament {
  id: string;
  title: string;
  slug: string;
  banner?: string | null;
  description: string;
  season?: string;
  game?: string;
  format: 'SQUAD' | 'DUO' | 'SOLO';
  maxSlots: number;
  registeredSlots: number;
  prizePool: string;
  prizeBreakdown?: string | null;
  rules: string;
  scheduleStart: string;
  scheduleEnd: string;
  regOpenAt?: string | null;
  regCloseAt?: string | null;
  timezone?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  pointSystem: string;
  scoringConfig?: string | null;
  mapsConfig?: string | null;
  minRosterSize?: number;
  maxRosterSize?: number;
  organizerId: string;
  organizer?: {
    id: string;
    username: string;
  };
  registrations?: TournamentRegistration[];
  stages?: TournamentStage[];
  matches?: Match[];
  _count?: {
    registrations: number;
    matches: number;
  };
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  teamId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISQUALIFIED';
  rosterSnapshot?: string | null;
  registeredAt: string;
  team: Team;
}

export interface TournamentStage {
  id: string;
  tournamentId: string;
  stageName: string;
  sequenceOrder: number;
  stageType: string;
  groups?: TournamentGroup[];
}

export interface TournamentGroup {
  id: string;
  stageId: string;
  groupName: string;
  slots?: GroupSlot[];
}

export interface GroupSlot {
  id: string;
  groupId: string;
  slotNumber: number;
  teamId?: string | null;
  team?: {
    id: string;
    name: string;
    tag: string;
    logo?: string | null;
    members?: TeamMember[];
  };
}

export interface Match {
  id: string;
  tournamentId: string;
  stageId?: string | null;
  groupId?: string | null;
  matchNumber: number;
  matchName: string;
  map: 'ERANGEL' | 'MIRAMAR' | 'SANHOK' | 'VIKENDI';
  scheduledAt: string;
  status: 'SCHEDULED' | 'ROOM_OPEN' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  resultStatus?: 'PENDING_REVIEW' | 'DISPUTED' | 'APPROVED' | 'FINALIZED';
  evidenceUrl?: string | null;
  reviewedById?: string | null;
  reviewedBy?: {
    id: string;
    username: string;
  } | null;
  reviewNotes?: string | null;
  hasCredentials?: boolean;
  credentialsReleased?: boolean;
  tournament?: {
    id: string;
    title: string;
    slug: string;
  };
  stage?: TournamentStage;
  group?: TournamentGroup;
  teamResults?: MatchTeamResult[];
  playerResults?: MatchPlayerResult[];
}

export interface MatchTeamResult {
  id: string;
  matchId: string;
  teamId: string;
  team: {
    id: string;
    name: string;
    tag: string;
    logo?: string | null;
  };
  placement: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
  isWwcd: boolean;
}

export interface MatchPlayerResult {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  player: {
    id: string;
    ign: string;
    bgmiUid: string;
  };
  kills: number;
  damage: number;
  isMvp: boolean;
}

export interface StandingRow {
  rank: number;
  teamId: string;
  teamName: string;
  teamTag: string;
  teamLogo?: string | null;
  matchesPlayed: number;
  wwcdCount: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
}

export interface MVPLeaderboardRow {
  rank: number;
  playerId: string;
  ign: string;
  bgmiUid: string;
  role: string;
  teamTag: string;
  teamName: string;
  avatar?: string | null;
  matchesPlayed: number;
  totalKills: number;
  totalDamage: number;
  mvpTitles: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'TOURNAMENT' | 'SCRIM' | 'NOTICE' | 'RULE_CHANGE' | 'GENERAL';
  isPinned: boolean;
  authorId: string;
  author: {
    id: string;
    username: string;
    role: string;
  };
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface PlayerDashboardData {
  player: User & { memberTeams?: Team[] };
  registrations: Array<TournamentRegistration & { tournament: Tournament }>;
  groupSlots: Array<GroupSlot & { group: { groupName: string; stage: { tournamentId: string; stageName: string } } }>;
  upcomingMatches: Array<Match & { tournament: Tournament }>;
  matchResults: Array<MatchTeamResult & { match: Match & { tournament: { title: string; slug: string } } }>;
  announcements: Announcement[];
}
