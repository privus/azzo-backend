import { AppDataSource } from './data-source';
import { runSeeders } from 'typeorm-extension';
import { MainSeeder } from './seeds/mainSeeder';

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    await runSeeders(AppDataSource, {
      seeds: [MainSeeder],
      factories: [], // Adicione factories se tiver
    });

    console.log('Seeding completed!');
    await AppDataSource.destroy();
  } catch (err) {
    console.error('Error during Data Source initialization or seeding:', err);
    process.exit(1);
  }
}

runSeeds();
