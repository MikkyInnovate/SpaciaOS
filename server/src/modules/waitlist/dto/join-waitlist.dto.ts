import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { Transform } from "class-transformer";

export class JoinWaitlistDto {
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Please provide a valid corporate or professional email" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  email!: string;

  /**
   * Optional referral code of the user who invited this subscriber
   */
  @IsOptional()
  @IsString()
  @MaxLength(24)
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  ref?: string;

  /**
   * Hidden honeypot field to trap spam bots silently.
   * If populated, the request is accepted optimistically without saving.
   */
  @IsOptional()
  @IsString()
  honeypot?: string;
}
