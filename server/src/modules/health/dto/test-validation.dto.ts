import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class TestValidationDto {
  @IsEmail({}, { message: "email must be a valid email address" })
  @IsNotEmpty({ message: "email is required" })
  email!: string;

  @IsString({ message: "name must be a string" })
  @MinLength(3, { message: "name must be at least 3 characters long" })
  name!: string;
}
