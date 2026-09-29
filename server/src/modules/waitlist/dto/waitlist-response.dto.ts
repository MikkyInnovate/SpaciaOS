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
  growthPercentage: number;
  recentMilestone: string;
}
