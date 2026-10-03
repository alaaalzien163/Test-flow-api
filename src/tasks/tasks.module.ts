import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [ProjectsModule, UsersModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
