const core = require('@actions/core');
const sftpClient = require('ssh2-sftp-client');

let sftp = new sftpClient();

async function run() {
  try {
    await sftp.connect({
      host: core.getInput('host', { required: true }),
      port: core.getInput('port', { required: true }),
      username: core.getInput('username', { required: true }),
      privateKey: core.getInput('private_key', { required: true }),
    });

    const lockFileDir = core.getInput('lock_file_dir', { required: true });
    const lockFile = process.env['STATE_lockfile'] || '';
    if (!lockFile) {
      core.debug("no lock file to delete");
      return;
    }

    const write = !!core.getInput('write');
    if (write) {
      core.info("writing file to sftp");

      const remote_path = core.getInput('remote_path', { required: true });
      const local_path = core.getInput('local_path', { required: true });

      await sftp.fastPut(local_path, remote_path);
    }

    core.info("deleting lock file");
    await sftp.delete(`${lockFileDir}/${lockFile}`);
    await sftp.end();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
