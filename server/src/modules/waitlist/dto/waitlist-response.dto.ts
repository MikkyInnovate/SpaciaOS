export interface WaitlistJoinResponseDto {
  success: boolean;
  message: string;
  position: number;
  totalCount: number;
  referralCode: string;
  alreadyJoined: boolean;
  maskedEmail: string;
}

export interface WaitlistStatsResponseDto {
  totalCount: number;
  activeToday: number;
  /** Not tracked yet; null rather than an invented figure. */
  growthPercentage: number | null;
  recentMilestone: string | null;
}

export interface WaitlistProfileResponseDto {
  success: boolean;
  position: number;
}
