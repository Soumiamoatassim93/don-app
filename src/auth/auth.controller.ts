import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
    @Post('register')
  async register(
    @Body() body: { email: string; password: string; nom: string; telephone?: string }
  ) {
    return this.authService.register(
      body.email,
      body.password,
      body.nom,
      body.telephone,
    );
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('user')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }
}
