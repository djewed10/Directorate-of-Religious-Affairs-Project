import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AidRecordsModule } from './aid-records/aid-records.module';
import { AssociationsModule } from './associations/associations.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { RolesGuard } from './common/roles.guard';
import { ConsumptionModule } from './consumption/consumption.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './db/database.module';
import { DocumentTypesModule } from './document-types/document-types.module';
import { DocumentsModule } from './documents/documents.module';
import { ExternalUpdateRequestsModule } from './external-update-requests/external-update-requests.module';
import { InternalNotesModule } from './internal-notes/internal-notes.module';
import { JobsModule } from './jobs/jobs.module';
import { MosquesModule } from './mosques/mosques.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProgressionModule } from './progression/progression.module';
import { ReferenceModule } from './reference/reference.module';
import { SearchModule } from './search/search.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '8h') },
      }),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AssociationsModule,
    MosquesModule,
    AidRecordsModule,
    DocumentTypesModule,
    DocumentsModule,
    ProgressionModule,
    ConsumptionModule,
    NotificationsModule,
    ExternalUpdateRequestsModule,
    InternalNotesModule,
    DashboardModule,
    SearchModule,
    ReferenceModule,
    StorageModule,
    JobsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

