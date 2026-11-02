import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteMeDto } from './dto/delete-me.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { PUBLIC_USER_FIELDS } from './public-user';

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
      // Fields left out are not changed.
      data: { timeZone: dto.timeZone, climber: dto.climber },
      select: PUBLIC_USER_FIELDS,
    });
  }

  /**
   * Changes the password after checking the current one. Every other login
   * (other phones, other browsers) is ended; this one stays logged in.
   */
  async changePassword(
    userId: string,
    sessionId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    await this.checkPassword(userId, dto.currentPassword);
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException(
        'The new password must be different from the current one.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.session.updateMany({
        where: { userId, id: { not: sessionId }, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  /**
   * Deletes the account for good, after checking the password. The database
   * removes everything that belongs to it too: habits, ticks, climbs, logins.
   */
  async deleteMe(userId: string, dto: DeleteMeDto): Promise<void> {
    await this.checkPassword(userId, dto.password);
    await this.prisma.user.delete({ where: { id: userId } });
  }

  /**
   * Throws 400 (not 401) when the password is wrong: the apps treat any 401 as
   * "your login has ended", and a typo shouldn't log anyone out.
   */
  private async checkPassword(userId: string, password: string) {
    const { passwordHash } = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!(await bcrypt.compare(password, passwordHash))) {
      throw new BadRequestException('That password is not right.');
    }
  }
}
