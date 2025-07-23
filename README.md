# BiometricUpdater

An automated Node.js script scheduled via cron to update employee Daily Time Records (DTR) every day.

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone [https://your-repo-url.git](https://github.com/nicoljul1997/ZKTBiometricUpdater.git)
cd biometric-updater
```

### 2. Configure Environment Variables

Copy the example environment file and populate the necessary values:

```bash
cp .env.sample .env
```

Open `.env` and replace the placeholder values with your actual configuration (e.g., database credentials, API keys, etc.).

### 3. Load `.env` File in the Script

Ensure the script loads the environment variables when executed by cron. Add this line at the top of your script:

```js
require('dotenv').config({ path: '/absolute/path/to/your/.env', quiet: true });
```

> ⚠️ Use an absolute path for the `.env` file to ensure compatibility with cron.

---

## 🕒 Cron Job Setup

To schedule the script to run automatically every day at 1:00 AM:

1. Open the crontab editor:

    ```bash
    crontab -e
    ```

2. Add the following line:

    ```bash
    0 1 * * * /home/administrator/.nvm/versions/node/v20.19.3/bin/node /absolute/path/to/your/sample.js >> /absolute/path/to/log/sample.log 2>&1
    ```

This will:
- Run the script daily at **1:00 AM**
- Log both output and errors to the specified log file

---

## 🧪 Testing Your Setup

You can manually test the script to verify everything works:

```bash
node /absolute/path/to/your/sample.js
```

Check the log file or console output for any errors.

---

> ✅ Replace these values in your `.env` file based on your environment.
