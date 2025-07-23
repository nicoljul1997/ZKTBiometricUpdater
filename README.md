# BiometricUpdater


An automated script scheduled via a cron job to update employee Daily Time Records (DTR) on a daily basis.


## Setting Up Environment Variables with Cron


To ensure environment variables are loaded when your script runs via cron, add the following line at the top of your code:


```bash
require('dotenv').config({ path: '/path/of/your/.env', quiet: true });
```


## Cron Job Setup


Setup cron job

```bash
  crontab -e
```


Add the following line to schedule the script to run daily at 1:00 AM:


```bash
0 1 * * * /home/administrator/.nvm/versions/node/v20.19.3/bin/node /path/to/the/file/sample.js >> /path/where/to/log/sample.log 2>&1
```

