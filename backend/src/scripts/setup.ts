import mongoose from 'mongoose';
import { config } from 'dotenv';
import { settingsModel } from 'src/settings/schema/settings.schema';

config();

async function setup() {
  await mongoose.connect(process.env.DATABASE_URL);

  // const SettingsModel = mongoose.model('Settings', SettingsSchema);

  await settingsModel.deleteMany();

  const settings = new settingsModel({
    settings: {
      roleType: {
        isSingleChoice: true,
        label: 'Role Type',
        options: [
          'Branding',
          'Content Writing',
          'Graphic Design',
          'Illustration',
          'Marketing',
          'Photography',
          'Public Relations',
          'Social Media Strategy',
          'Videography',
          'Video Editing',
        ],
      },
      jobLocation: {
        isSingleChoice: true,
        label: 'Job Location',
        options: [
          'Ahmedabad',
          'Bangalore',
          'Chennai',
          'Delhi, NCR',
          'Hyderabad',
          'Kolkata',
          'Mumbai',
          'Remote',
        ],
      },
      jobType: {
        isSingleChoice: true,
        label: 'Job Type',
        options: [
          'Internship',
          'Full-time',
          'Part-time',
          'Remote',
          'Hybrid',
          'Freelance / Project Based',
          'Volunteer Work',
        ],
      },
      jobCategory: {
        isSingleChoice: true,
        label: 'Job Category',
        options: ['IT', 'Marketing', 'Sales', 'Engineering', 'Design'],
      },
      experienceLevel: {
        isSingleChoice: true,
        label: 'Experience Level',
        options: [
          'Entry-Level, No Experience Required',
          'Junior (1-2 years)',
          'Mid-level (3-4 years)',
          'Senior (5-8 years)',
          'Expert (9+ years)',
        ],
      },
      workType: {
        isSingleChoice: true,
        label: 'Work Type',
        options: ['Remote', 'Hybrid', 'In-Person', 'Flexible'],
      },
      workingDays: {
        isSingleChoice: true,
        label: 'Working Days',
        options: ['Monday to Friday', 'Monday to Saturday', 'Other'],
      },
      candidateAvailability: {
        isSingleChoice: true,
        label: 'Candidate Availability',
        options: [
          'As soon as possible',
          'In the next few months',
          'Not Sure, will move for right role',
          'Not looking, just curious',
        ],
      },
      areaOfExpertise: {
        isSingleChoice: true,
        label: 'Area of Expertise',
        options: [
          'Graphic Design',
          'Marketing',
          'Content Writing',
          'Public Relations',
          'Social Media',
          'Business Development',
          'Visual Merchandising',
          'Sales',
          'Styling',
          'Videography',
          'Photography',
        ],
      },
    },
  });

  const settingsCount = await settingsModel.countDocuments();
  if (settingsCount > 0) {
    console.log('Settings already exists');
    return;
  }

  await settings.save();
}

setup()
  .then(() => {
    console.log('Setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed', error);
    process.exit(1);
  })
  .finally(() => {
    mongoose.connection.close();
  });
