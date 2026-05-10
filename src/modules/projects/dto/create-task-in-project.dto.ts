import { OmitType } from '@nestjs/swagger';
import { CreateTaskDto } from '../../tasks/dto/create-task.dto';

export class CreateTaskInProjectDto extends OmitType(CreateTaskDto, [
    'projectId',
] as const) { }
