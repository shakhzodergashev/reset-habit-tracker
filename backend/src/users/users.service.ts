import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';

// The user fields that are safe to send to the client (never the password hash).
const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  timeZone: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_FIELDS,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  updateMe(userId: string, dto: UpdateMeDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { timeZone: dto.timeZone },
      select: PUBLIC_USER_FIELDS,
    });
  }
}
