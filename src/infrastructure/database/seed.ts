import { mongoDataSource } from './data-source';
import { runSeeders } from 'typeorm-extension';
import { MainSeeder } from './seeds/mainSeeder';

async function runSeeds() {
  try {
    await mongoDataSource.initialize();
    console.log('Data Source has been initialized!');

    await runSeeders(mongoDataSource, {
      seeds: [MainSeeder],
      factories: [], // Adicione factories se tiver
    });

    console.log('Seeding completed!');
    await mongoDataSource.destroy();
  } catch (err) {
    console.error('Error during Data Source initialization or seeding:', err);
    process.exit(1);
  }
}

runSeeds();
