import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import CandidatesService from './candidates.service';
import { Query as QueryInterface } from 'src/common/interfaces/query.interface';
import { CreateCandidateDto } from './dtos/create-candidate.dto';
import { UpdateCandidateDto } from './dtos/update-candidate.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  /**
   * Get all candidates
   * @param query
   * @returns
   */
  @Get()
  findAll(@Query() query: QueryInterface) {
    return this.candidatesService.getAllCandidates(query);
  }

  /**
   * Get a candidate by id
   * @param id
   * @returns
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.candidatesService.getCandidate(id);
  }

  /**
   * Create a candidate
   * @param createCandidateDto
   * @returns
   */
  @Post()
  create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.createCandidate(createCandidateDto);
  }

  /**
   * Update a candidate
   * @param id
   * @param updateCandidateDto
   * @returns
   */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
  ) {
    return this.candidatesService.updateCandidate(id, updateCandidateDto);
  }

  /**
   * Delete a candidate
   * @param id
   * @returns
   */
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.candidatesService.deleteCandidate(id);
  }

  @Put(':id/assign-to-recruiter')
  assignToRecruiter(
    @Param('id') id: string,
    @Body('recruiterId') recruiterId: string,
  ) {
    return this.candidatesService.assignCandidateToRecruiter(id, recruiterId);
  }

  @Put(':id/save-job')
  saveJob(@Param('id') id: string, @Body('jobIds') jobIds: string[]) {
    return this.candidatesService.saveJob(id, jobIds);
  }
}
