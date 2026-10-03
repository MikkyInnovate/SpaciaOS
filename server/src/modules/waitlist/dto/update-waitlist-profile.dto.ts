import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, Length, Matches, MaxLength } from "class-validator";
import { Transform } from "class-transformer";

export const TEAM_SIZES = ["1-5", "6-20", "21-50", "50+"] as const;
export type TeamSize = (typeof TEAM_SIZES)[number];

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);

export class UpdateWaitlistProfileDto {
  /** The subscriber's own referral code, returned to them when they joined. */
  @IsNotEmpty({ message: "Referral code is required" })
  @IsString()
  @MaxLength(24)
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  referralCode!: string;

  @IsString()
  @Transform(trim)
  @Length(2, 120, { message: "Please enter your full name" })
  fullName!: string;

  /** Stored as E.164 (+ then 7–15 digits), e.g. +2348012345678. Spaces, dashes and brackets are stripped. */
  @IsNotEmpty({ message: "Please enter your phone number" })
  @Transform(({ value }) => {
    if (typeof value !== "string") return value;
    const digits = value.replace(/[\s\-().]/g, "");
    return digits.startsWith("+") ? digits : `+${digits.replace(/^00/, "")}`;
  })
  @Matches(/^\+[1-9]\d{6,14}$/, { message: "Please enter a valid phone number with country code" })
  phone!: string;

  @IsString()
  @Transform(trim)
  @Length(2, 160, { message: "Please enter your company name" })
  companyName!: string;

  /** Optional; accepted with or without a protocol and stored as https://… */
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== "string") return value;
    const v = value.trim();
    if (!v) return undefined;
    return /^https?:\/\//i.test(v) ? v.replace(/^http:\/\//i, "https://") : `https://${v}`;
  })
  @IsUrl({ require_protocol: true, protocols: ["https"] }, { message: "Please enter a valid website, e.g. yourcompany.com" })
  @MaxLength(255)
  companyWebsite?: string;

  @IsOptional()
  @IsIn(TEAM_SIZES as unknown as string[], { message: "Please choose a team size" })
  teamSize?: TeamSize;
}
