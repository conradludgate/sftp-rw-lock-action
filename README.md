# SFTP Read Write Lock

Download files from an SFTP server, modify them and upload them again with safe read-write locks.

## How it works

The action creates a new file in the lock dir with a random uuid, with read/write.lock.
`/tmp/lock-dir/da4da92e-53ea-47d2-ad40-19b184203e7f.read.lock`.
It then reads the dir to see if any other lock files exist in there, sorting them based on creation time.

If we have requested a read lock, and before us is no other write lock, then we can proceed safely.
If we have requested a write lock, then we must be the first item in the list to proceed safely.
In any other case, we wait a random number of seconds (5-10) before checking the list again.
Once it's safe for us to proceed, we download the file.

Once the workflow is done, a cleanup step is run to upload the file if requested, then to delete the lock file.

## Example

Download the file at `/var/some/file.txt` to `file.txt` as readonly

```yml
uses: conradludgate/sftp-rw-lock-action@v1
with:
  host: ssh.example.com
  username: user
  private_key: ${{ secrets.SSH_PRIVATE_KEY }}
  lock_file_dir: "/tmp/example-lock/"
  remote_path: "/var/some/file.txt"
  local_path: "file.txt"
```

Download the file at `/var/some/file.txt` to `file.txt` as writeable

```yml
uses: conradludgate/sftp-rw-lock-action@v1
with:
  host: ssh.example.com
  username: user
  private_key: ${{ secrets.SSH_PRIVATE_KEY }}
  lock_file_dir: "/tmp/example-lock/"
  remote_path: "/var/some/file.txt"
  local_path: "file.txt"
  write: true
```
