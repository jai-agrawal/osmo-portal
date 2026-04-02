import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { FilesService } from './files.service';
import { CreateFileDto } from './dtos/create-file.dto';
import { Query as QueryInterface } from 'src/common/interfaces/query.interface';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  create(@Body() createFileDto: CreateFileDto) {
    return this.filesService.create(createFileDto);
  }

  @Post('signed-urls')
  createSignedUrls(@Body() createFileDto: CreateFileDto[]) {
    return this.filesService.createSignedUrls(createFileDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get()
  findAll(@Query() query: QueryInterface) {
    return this.filesService.findAll(query);
  }
}
