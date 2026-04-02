import { InjectModel } from '@nestjs/mongoose';
import { Client } from './schema/client.schema';
import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Meta } from 'src/common/interfaces/meta.interface';
import { Query } from 'src/common/interfaces/query.interface';
import { CreateClientDto } from './dtos/create-client.dto';
import { UpdateClientDto } from './dtos/update-client.dto';
@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name)
    private readonly clientModel: Model<Client>,
  ) {}

  /**
   * Find all clients
   * @param query - The query parameters
   * @returns The clients and meta
   */
  async findAll(query: Query): Promise<{
    data: Client[];
    meta: Meta;
  }> {
    const skip = (query.page - 1) * query.pageSize;
    const search = query.search;
    const findConditions = {
      ...(query.filters || {}),
    };

    if (query.startDate || query.endDate) {
      findConditions.createdAt = {};
      if (query.startDate) {
        findConditions.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        findConditions.createdAt.$lte = end;
      }
    }

    if (query.location) {
      findConditions.location = { $in: query.location.split(',') };
    }

    if (query.workingDays) {
      findConditions.workingDays = { $in: query.workingDays.split(',') };
    }

    if (query.isDeleted === 'false') {
      findConditions.isDeleted = false;
    }

    if (search) {
      findConditions.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (query.sort) {
      query.sort = query.sort.split(',').map((sort) => {
        const sortArray = sort.split(':');
        return [sortArray[0], sortArray[1] === 'asc' ? 1 : -1];
      });
    }
    const clients = await this.clientModel
      .find(findConditions)
      .skip(skip)
      .limit(query.pageSize)
      .sort(query.sort)
      .select(query.fields);

    const meta = await this.clientModel.countDocuments(findConditions);

    return {
      data: clients,
      meta: {
        total: meta,
        page: query.page,
        limit: query.pageSize,
        pages: Math.ceil(meta / query.pageSize),
      },
    };
  }

  /**
   * Find a client by ID
   * @param id - The ID of the client to find
   * @returns The client
   */
  async findOne(id: string): Promise<Client> {
    const client = await this.clientModel.findById(id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  /**
   * Create a client
   * @param createClientDto - The create data
   * @returns The created client
   */
  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = new this.clientModel(createClientDto);
    return client.save();
  }

  /**
   * Update a client
   * @param id - The ID of the client to update
   * @param updateClientDto - The update data
   * @returns The updated client
   */
  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, updateClientDto);
    return client.save();
  }

  /**
   * Soft delete a client
   * @param id - The ID of the client to delete
   */
  async delete(id: string): Promise<Client> {
    const client = await this.findOne(id);
    await client.updateOne({ isDeleted: true });
    return client;
  }

  async getDistinctClientNames(): Promise<string[]> {
    return this.clientModel.distinct('name');
  }
}
