import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

// Cost factor: each +1 doubles the hashing time. 12 takes roughly 0.2 seconds.
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      return await this.prisma.user.create({
        data: { email: dto.email, passwordHash, timeZone: dto.timeZone },
        // Never send the password hash back to the client.
        select: { id: true, email: true, timeZone: true, createdAt: true },
      });
    } catch (error) {
      // P2002 = unique constraint failed, i.e. this email is already registered.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }
}
