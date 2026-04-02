import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File } from './schema/file.schema';
import { CreateFileDto } from './dtos/create-file.dto';
import { S3Service } from 'src/common/services/s3.service';
import { Meta } from 'src/common/interfaces/meta.interface';
import { Query as QueryInterface } from 'src/common/interfaces/query.interface';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(File.name)
    private readonly fileModel: Model<File>,
    private readonly s3Service: S3Service,
  ) {}

  async create(createFileDto: CreateFileDto): Promise<File> {
    const signedUrl = await this.s3Service.createSignedUrl(createFileDto);
    return this.fileModel.create({ ...createFileDto, ...signedUrl });
  }

  async createSignedUrls(files: CreateFileDto[]): Promise<File[]> {
    // Create signed urls for the files
    const signedUrls = await this.s3Service.createSignedUrls(files);
    return this.fileModel.create(signedUrls);
  }

  async findOne(id: string): Promise<File> {
    return this.fileModel.findById(id);
  }

  async delete(id: string): Promise<File> {
    return this.fileModel.findByIdAndDelete(id);
  }

  async findAll(query: QueryInterface): Promise<{
    data: File[];
    meta: Meta;
  }> {
    const files = await this.fileModel
      .find(query.filters)
      .skip(query.skip)
      .limit(query.limit)
      .sort(query.sort)
      .select(query.fields);
    const meta = await this.fileModel.countDocuments(query.filters);
    return {
      data: files,
      meta: {
        total: meta,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(meta / query.limit),
      },
    };
  }
}
