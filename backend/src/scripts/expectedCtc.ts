import mongoose from 'mongoose';
import { config } from 'dotenv';
import { CandidateModel } from '../candidates/schema/candidate.schema';
import { JobApplicationModel } from '../job-applications/schema/job-application.schema';

config();

function mapExpectedCtcToRange(expectedCtc: string): { min: number; max: number } {
  switch (expectedCtc) {
    case 'Under 1L':
      return { min: 0, max: 1 };
    case '1-5 LPA':
      return { min: 1, max: 5 };
    case '5-10 LPA':
      return { min: 5, max: 10 };
    case '10-15 LPA':
      return { min: 10, max: 15 };
    case '15-20 LPA':
      return { min: 15, max: 20 };
    case '20-25 LPA':
      return { min: 20, max: 25 };
    case '25-30 LPA':
      return { min: 25, max: 30 };
    case '30-35 LPA':
      return { min: 30, max: 35 };
    case '35-40 LPA':
      return { min: 35, max: 40 };
    case '40-50 LPA':
      return { min: 40, max: 50 };
    case '50 LPA +':
      return { min: 50, max: 999 };
    default:
      return { min: 0, max: 0 };
  }
}

async function expectedCtcMigration() {
  await mongoose.connect(process.env.DATABASE_URL);

  const totalCandidates = await CandidateModel.countDocuments({});
  console.log(`Total Candidates: ${totalCandidates}`);

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  const batchSize = 100;

  const cursor = CandidateModel.find({}).lean().cursor();

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const candidate = doc;
    const { min, max } = mapExpectedCtcToRange(candidate.expectedCtc);

    if (min !== 0 || max !== 0) {
      await CandidateModel.findByIdAndUpdate(candidate._id, {
        $set: {
          minExpectedCtc: min,
          maxExpectedCtc: max,
        },
      });
      updated++;
      
      if (processed % 100 === 0) {
        console.log(`Processed: ${processed}/${totalCandidates} | Updated: ${updated} | Skipped: ${skipped}`);
      }
    } else {
      skipped++;
    }

    processed++;
  }

  await cursor.close();
  console.log(`Migration completed - Processed: ${processed} | Updated: ${updated} | Skipped: ${skipped}`);
  // let processed = 0;
  // let skipped = 0;
  // let failed = 0;

  // const progressBar = new cliProgress.SingleBar({
  //   format: 'Processing |{bar}| {percentage}% | {value}/{total} Jobs | ✅ {processed} | ⚠️ {skipped} | ❌ {failed}',
  //   barCompleteChar: '█',
  //   barIncompleteChar: '░',
  //   hideCursor: true,
  // });
}

async function jobApplicationExpectedCtcMigration() {
  await mongoose.connect(process.env.DATABASE_URL);

  const jobApplications = await JobApplicationModel.find({}).lean();
  console.log(`Total Job Applications: ${jobApplications.length}`);

  for (const jobApplication of jobApplications) {
    let minExpectedCtc = 0;
    let maxExpectedCtc = 0;

    if (jobApplication.expectedCtc === 'Under 1L') {
      minExpectedCtc = 0;
      maxExpectedCtc = 1;
    } else if (jobApplication.expectedCtc === '1-5 LPA') {
      minExpectedCtc = 1;
      maxExpectedCtc = 5;
    } else if (jobApplication.expectedCtc === '5-10 LPA') {
      minExpectedCtc = 5;
      maxExpectedCtc = 10;
    } else if (jobApplication.expectedCtc === '10-15 LPA') {
      minExpectedCtc = 10;
      maxExpectedCtc = 15;
    } else if (jobApplication.expectedCtc === '15-20 LPA') {
      minExpectedCtc = 15;
      maxExpectedCtc = 20;
    } else if (jobApplication.expectedCtc === '20-25 LPA') {
      minExpectedCtc = 20;
      maxExpectedCtc = 25;
    } else if (jobApplication.expectedCtc === '25-30 LPA') {
      minExpectedCtc = 25;
      maxExpectedCtc = 30;
    } else if (jobApplication.expectedCtc === '30-35 LPA') {
      minExpectedCtc = 30;
      maxExpectedCtc = 35;
    } else if (jobApplication.expectedCtc === '35-40 LPA') {
      minExpectedCtc = 35;
      maxExpectedCtc = 40;
    } else if (jobApplication.expectedCtc === '40-50 LPA') {
      minExpectedCtc = 40;
      maxExpectedCtc = 50;
    } else if (jobApplication.expectedCtc === '50 LPA +') {
      minExpectedCtc = 50;
      // maxExpectedCtc = 999; // No upper limit for 50+
    }

    if (minExpectedCtc !== 0 && maxExpectedCtc !== 0) {
      await JobApplicationModel.findByIdAndUpdate(jobApplication._id, {
        $set: {
          minExpectedCtc: minExpectedCtc,
          maxExpectedCtc: maxExpectedCtc,
        },
      });
    }
  }

  console.log(`Total Job Applications processed: ${jobApplications.length}`);
}

expectedCtcMigration()
  .then(() => {
    console.log('Expected CTC Migration completed');
  })
  .catch((error) => {
    console.error('Expected CTC Migration failed', error);
  })
  .finally(() => {
    // mongoose.connection.close();
  });

jobApplicationExpectedCtcMigration()
  .then(() => {
    console.log('Job Application Expected CTC Migration completed');
  })
  .catch((error) => {
    console.error('Job Application Expected CTC Migration failed', error);
  })
  .finally(() => {
    mongoose.connection.close();
  });
