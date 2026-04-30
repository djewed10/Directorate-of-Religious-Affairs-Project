import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth-user.decorator';
import { Public } from '../common/public.decorator';
import type { AuthUser } from '../common/types';
import { CreateExternalRequestDto } from './dto/create-external-request.dto';
import { SubmitExternalRequestDto } from './dto/submit-external-request.dto';
import { ExternalUpdateRequestsService } from './external-update-requests.service';

@ApiTags('external-update-requests')
@Controller()
export class ExternalUpdateRequestsController {
  constructor(private readonly externalRequestsService: ExternalUpdateRequestsService) {}

  @ApiBearerAuth()
  @Get('external-update-requests')
  list(@Query('mosqueId') mosqueId?: string) {
    return this.externalRequestsService.list(mosqueId);
  }

  @ApiBearerAuth()
  @Post('external-update-requests')
  create(@Body() dto: CreateExternalRequestDto, @CurrentUser() user: AuthUser) {
    return this.externalRequestsService.create(dto, user);
  }

  @Public()
  @Get('external/:token')
  getPublic(@Param('token') token: string) {
    return this.externalRequestsService.getPublic(token);
  }

  @Public()
  @Post('external/:token/submit')
  submit(@Param('token') token: string, @Body() dto: SubmitExternalRequestDto) {
    return this.externalRequestsService.submit(token, dto);
  }
}

