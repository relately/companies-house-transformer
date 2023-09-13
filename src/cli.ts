import { program } from 'commander';
import { format, parse } from 'fast-csv';
import { globStream } from 'glob';
import { createReadStream, existsSync, lstatSync } from 'node:fs';

program
  .name('cht')
  .description('CLI to convert Companies House data products to CSV and JSON');

program
  .command('transform')
  // TODO support '-' for stdin
  .addArgument(program.createArgument('<input>', 'the input file or directory'))
  .addOption(
    program
      .createOption('-p, --product <product>', 'the data product to transform')
      .choices(['auto', 'prod217', '217'])
      .default('auto')
  )
  .addOption(
    program
      .createOption('-f, --format <format>', 'the output format')
      .choices(['csv', 'json'])
      .default('csv')
  )
  .option('-o, --output', 'output to file')
  .option('-d, --debug', 'show debugging information', false)
  .action((input) => {
    if (!existsSync(input)) {
      process.stderr.write(`File or directory "${input}" does not exist`);
      process.exit(1);
    }

    if (lstatSync(input).isDirectory()) {
      process.stderr.write(
        'Directory provided, processing all files within it'
      );

      const stream = globStream(`${input}/**/*.csv`, {});

      // Stream each file through the pipeline
      stream.on('data', (file) => {
        createReadStream(file)
          .pipe(parse({ headers: true }))
          .pipe(format({ headers: true }))
          .pipe(process.stdout);
      });
    } else {
      createReadStream(input)
        .pipe(parse({ headers: true }))
        .pipe(format({ headers: true }))
        .pipe(process.stdout);
    }
  });

program.parse();
