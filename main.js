const core = require('@actions/core');
const sftpClient = require('ssh2-sftp-client');
const { v4: uuidv4 } = require('uuid');

let sftp = new sftpClient();

async function listLocks(lockFileDir) {
  let files = await sftp.list(lockFileDir);
  files.sort((a, b) => {
    const tDelta = a.modifyTime - b.modifyTime
    if (tDelta !== 0) {
      return tDelta
    }
    if (a.name < b.name) {
      return -1;
    }
    return 1;
  })
  return files;
}

async function shouldWait(lockFileDir, lockFile) {
  const files = await listLocks(lockFileDir);
  if (lockFile.endsWith("write.lock")) {
    // If the first file isn't the lockfile,
    // then we can't safely write
    return files[0].name != lockFile;
  }
  for (let i = 0; i < files.length; i++) {
    const name = files[i].name;
    if (name == lockFile) {
      return false;
    }
    // there's a write file waiting before us
    if (name.endsWith("write.lock")) {
      return true;
    }
  }
}

async function wait(milliseconds) {
  return new Promise((resolve) => {
    if (typeof milliseconds !== 'number') {
      throw new Error('milliseconds not a number');
    }
    setTimeout(() => resolve("done!"), milliseconds)
  });
}

async function run() {
  try {
    await sftp.connect({
      host: core.getInput('host', { required: true }),
      port: core.getInput('port') || 22,
      username: core.getInput('username', { required: true }),
      privateKey: core.getInput('private_key', { required: true }),
    });

    const write = !!core.getInput('write');

    const lockFileDir = core.getInput('lock_file_dir', { required: true });
    const lockFile = `${uuidv4()}.${write ? "write" : "read"}.lock`;
    core.info(`aquiring lockfile ${lockFile}`);
    core.saveState('lockfile', lockFile);
    await sftp.put(Buffer.from("", "utf-8"), `${lockFileDir}/${lockFile}`);

    while (await shouldWait(lockFileDir, lockFile)) {
      const ms = Math.random()*5000+5000;
      core.info(`waiting ${ms}ms for lock files...`);
      wait(ms);
    }

    const remote_path = core.getInput('remote_path', { required: true });
    const local_path = core.getInput('local_path', { required: true });
    core.info(`getting file ${remote_path} => ${local_path}`);
    await sftp.get(remote_path, local_path);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
