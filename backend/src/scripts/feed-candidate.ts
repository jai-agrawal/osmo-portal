import mongoose from 'mongoose';
import { config } from 'dotenv';
import CandidatesService from 'src/candidates/candidates.service';
import { MailerService } from 'src/mailer/mailer.service';
import { EmailQueueService } from 'src/email-queue/email-queue.service';
import { CandidateSchema } from 'src/candidates/schema/candidate.schema';
import { EmailQueueSchema } from 'src/email-queue/schema/email-queue.schema';
import { EmailQueueSettingsSchema } from 'src/email-queue/schema/email-queue-settings.schema';
import { generatePassword } from 'src/common/utils/password';
import * as XLSX from 'xlsx';
import { CreateCandidateDto } from 'src/candidates/dtos/create-candidate.dto';
import * as cliProgress from 'cli-progress';
import { JobApplicationSchema } from 'src/job-applications/schema/job-application.schema';

config();

async function readExcelFile(filePath: string) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

async function feedCandidates() {
  console.log('🚀 Starting candidate import process...');
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('📊 Connected to database successfully');

    const candidateModel = mongoose.model('Candidate', CandidateSchema);
    const jobApplicationModel = mongoose.model(
      'JobApplication',
      JobApplicationSchema,
    );
    const mailerService = new MailerService();
    const emailQueueModel = mongoose.model('EmailQueue', EmailQueueSchema);
    const emailQueueSettingsModel = mongoose.model(
      'EmailQueueSettings',
      EmailQueueSettingsSchema,
    );
    const emailQueueService = new EmailQueueService(
      emailQueueModel as any,
      emailQueueSettingsModel as any,
      mailerService,
    );
    const candidatesService = new CandidatesService(
      candidateModel,
      jobApplicationModel,
      mailerService,
      emailQueueService,
    );

    const candidates: any[] = await readExcelFile(
      'src/scripts/osmo-candidate-template.xlsx',
    );
    console.log(`📋 Found ${candidates.length} candidates in Excel file`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    // Create progress bar
    const progressBar = new cliProgress.SingleBar({
      format:
        'Processing |{bar}| {percentage}% | {value}/{total} Candidates | ✅ {created} | ⚠️  {skipped} | ❌ {failed}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
    });

    // Initialize the progress bar
    progressBar.start(candidates.length, 0, {
      created: 0,
      skipped: 0,
      failed: 0,
    });

    // Process candidates in parallel
    await Promise.all(
      candidates.map(async (candidate, index) => {
        try {
          const existingCandidate = await candidatesService.getCandidateByEmail(
            candidate.email,
          );

          if (existingCandidate) {
            skipped++;
            progressBar.update(index + 1, { created, skipped, failed });
            return;
          }

          const createCandidateDto: CreateCandidateDto = {
            name: candidate.name,
            email: candidate.email,
            mobile: candidate.mobile.replace("'+91", ''),
            dateOfBirth: new Date(candidate.dob),
            password: await generatePassword('12345678'),
          };
          await candidatesService.createCandidate(createCandidateDto);
          created++;
          progressBar.update(index + 1, { created, skipped, failed });
        } catch (error) {
          failed++;
          progressBar.update(index + 1, { created, skipped, failed });
          console.error(
            `\n❌ Failed to process candidate ${candidate.email}:`,
            error,
          );
        }
      }),
    );

    // Stop the progress bar
    progressBar.stop();

    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully created: ${created} candidates`);
    console.log(`⚠️  Skipped existing: ${skipped} candidates`);
    console.log(`❌ Failed to process: ${failed} candidates`);
    console.log('✨ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Execute the function
feedCandidates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
