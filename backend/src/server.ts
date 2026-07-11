import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';

async function bootstrap() {
  await connectDatabase();
  const app = createApp();

  app.listen(Number(env.PORT), () => {
    // eslint-disable-next-line no-console
    console.log(`OMNIPAY backend running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error', error);
  process.exit(1);
});
