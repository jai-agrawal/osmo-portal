import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings } from './schema/settings.schema';
import { CreateSettingsDto } from './dtos/create-settings.dto';
import { UpdateSettingsDto } from './dtos/update-settings.dto';
import * as settingsData from '../data/settings.json';
export class SettingsService {
  constructor(
    @InjectModel(Settings.name)
    private readonly settingsModel: Model<Settings>,
  ) {}

  async create(createSettingsDto: CreateSettingsDto) {
    const settings = new this.settingsModel(createSettingsDto);
    return await settings.save();
  }

  async findOne() {
    return this.settingsModel.findOne();
  }

  async update(id: string, updateSettingsDto: UpdateSettingsDto) {
    await this.settingsModel.findByIdAndUpdate(id, updateSettingsDto);
    return this.findOne();
  }

  async setup() {
    const settings = await this.findOne();
    if (settings) {
      return;
    }
    return this.create(settingsData);
  }
}
