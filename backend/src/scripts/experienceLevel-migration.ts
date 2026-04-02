import mongoose from 'mongoose';
import { config } from 'dotenv';
import { JobApplicationModel } from '../job-applications/schema/job-application.schema';
import { JobModel } from '../jobs/schema/job.schema';
import { CandidateModel } from '../candidates/schema/candidate.schema';

config();

async function experienceLevelMigration() {
  await mongoose.connect(process.env.DATABASE_URL);

  const jobs = await JobModel.find({}).lean();

  for (const job of jobs) {
    if (job.experience === 'Entry-Level - No Experience Required') {
      job.minExperienceLevel = 0;
      job.maxExperienceLevel = 1;
    } else if (job.experience === 'Junior (1-2 years)') {
      job.minExperienceLevel = 1;
      job.maxExperienceLevel = 2;
    } else if (job.experience === 'Mid-level (3-4 years)') {
      job.minExperienceLevel = 3;
      job.maxExperienceLevel = 4;
    } else if (job.experience === 'Senior (5-8 years)') {
      job.minExperienceLevel = 5;
      job.maxExperienceLevel = 8;
    } else if (job.experience === 'Expert (9+ years)') {
      job.minExperienceLevel = 9;
      // job.maxExperienceLevel = 999;
    }

    console.log(job.experience, job.minExperienceLevel, job.maxExperienceLevel);

    await JobModel.findByIdAndUpdate(job._id, {
      $set: {
        minExperienceLevel: job.minExperienceLevel,
        maxExperienceLevel: job.maxExperienceLevel,
      },
    });
  }

  console.log(`Total Jobs: ${jobs.length}`);

  const candidates = await CandidateModel.find({}).lean();
  for (const candidate of candidates) {
    if (candidate.experienceLevel === 'Entry-Level - No Experience Required') {
      candidate.minExperienceLevel = 0;
      candidate.maxExperienceLevel = 1;
    } else if (candidate.experienceLevel === 'Junior (1-2 years)') {
      candidate.minExperienceLevel = 1;
      candidate.maxExperienceLevel = 2;
    } else if (candidate.experienceLevel === 'Mid-level (3-4 years)') {
      candidate.minExperienceLevel = 3;
      candidate.maxExperienceLevel = 4;
    } else if (candidate.experienceLevel === 'Senior (5-8 years)') {
      candidate.minExperienceLevel = 5;
      candidate.maxExperienceLevel = 8;
    } else if (candidate.experienceLevel === 'Expert (9+ years)') {
      candidate.minExperienceLevel = 9;
      // candidate.maxExperienceLevel = 999;
    }

    console.log(
      candidate.experienceLevel,
      candidate.minExperienceLevel,
      candidate.maxExperienceLevel,
    );

    if (
      candidate.minExperienceLevel !== 0 &&
      candidate.maxExperienceLevel !== 0 &&
      candidate.experienceLevel
    ) {
      await CandidateModel.findByIdAndUpdate(candidate._id, {
        $set: {
          minExperienceLevel: candidate.minExperienceLevel,
          maxExperienceLevel: candidate.maxExperienceLevel,
        },
      });
    }
  }

  console.log(`Total Candidates: ${candidates.length}`);

  const jobApplications = await JobApplicationModel.find({}).lean();
  for (const jobApplication of jobApplications) {
    if (
      jobApplication.experienceLevel === 'Entry-Level - No Experience Required'
    ) {
      jobApplication.minExperienceLevel = 0;
      jobApplication.maxExperienceLevel = 1;
    } else if (jobApplication.experienceLevel === 'Junior (1-2 years)') {
      jobApplication.minExperienceLevel = 1;
      jobApplication.maxExperienceLevel = 2;
    } else if (jobApplication.experienceLevel === 'Mid-level (3-4 years)') {
      jobApplication.minExperienceLevel = 3;
      jobApplication.maxExperienceLevel = 4;
    } else if (jobApplication.experienceLevel === 'Senior (5-8 years)') {
      jobApplication.minExperienceLevel = 5;
      jobApplication.maxExperienceLevel = 8;
    } else if (jobApplication.experienceLevel === 'Expert (9+ years)') {
      jobApplication.minExperienceLevel = 9;
      // jobApplication.maxExperienceLevel = 999;
    }

    console.log(
      jobApplication.experienceLevel,
      jobApplication.minExperienceLevel,
      jobApplication.maxExperienceLevel,
    );

    if (
      jobApplication.minExperienceLevel !== 0 &&
      jobApplication.maxExperienceLevel !== 0 &&
      jobApplication.experienceLevel
    ) {
      await JobApplicationModel.findByIdAndUpdate(jobApplication._id, {
        $set: {
          minExperienceLevel: jobApplication.minExperienceLevel,
          maxExperienceLevel: jobApplication.maxExperienceLevel,
        },
      });
    }
  }
  console.log(`Total Job Applications: ${jobApplications.length}`);
}

experienceLevelMigration()
  .then(() => {
    console.log('Experience Level Migration completed');
  })
  .catch((error) => {
    console.error('Experience Level Migration failed', error);
  })
  .finally(() => {
    mongoose.connection.close();
  });
