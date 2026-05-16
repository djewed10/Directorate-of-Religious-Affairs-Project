import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { JobsService } from './src/jobs/jobs.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const jobsService = app.get(JobsService);
  await jobsService.createDocumentExpirationNotifications();
  console.log('Done!');
  await app.close();
}
bootstrap();
