import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Query as QueryInterface } from 'src/common/interfaces/query.interface';
import { RecruitersService } from './recruiters.service';
import { CreateRecruiterDto } from './dtos/create-recruiter.dto';
import { UpdateRecruiterDto } from '../auth/recruiter/dtos/update-recruiter.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('recruiters')
export class RecruitersController {
  constructor(private readonly recruitersService: RecruitersService) {}

  @UseGuards(AuthGuard('recruiter-jwt'))
  @Get()
  findAll(@Query() query: QueryInterface) {
    return this.recruitersService.findAll(query);
  }

  @Get('dashboard')
  getDashboard() {
    return this.recruitersService.getDashboard();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recruitersService.findOne(id);
  }

  @Post()
  create(@Body() createRecruiterDto: CreateRecruiterDto) {
    return this.recruitersService.create(createRecruiterDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecruiterDto: UpdateRecruiterDto,
  ) {
    return this.recruitersService.update(id, updateRecruiterDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.recruitersService.delete(id);
  }
}
