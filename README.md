#savemysn

## Architecture
Archives - zips of backups - are kept on google cloud storage in the sms-archives bucket.

Here is what an offline-stored archive job would look like:

* Login to the sn (social network; i.e., Facebook ...)
* Pay for a backup
* Start the backup job
* Backend gets the sn's token (FB token for example)
* Backend collects all of the sn's photos n posts (FB photos from user into a folder)
* Backend zips folder and uploads it to sms-archives bucket
* All of this gets recorded into a mongodb document associated with sn account

## Database (sn account Database; i.e., Facebook ...)
Data is stored in mongodb atlas cluster - using an authorized google login / Company name in mongodb is xxxxxxxx (SledgeSoft for example)

## Development ...
* Only the production database works for now ... but the frontend can run locally
## Todo
*Try to get rid of all any typing
## Tasks ...
Add user retrieval from start Update status when job is running Add support for /job route to get job status - and show on the "chill" stage
