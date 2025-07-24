# ZKT Biometric Updater (v2.0) - Modular & Extensible

## Overview

The ZKT Biometric Updater is a completely refactored, modular and extensible Node.js application designed to streamline the process of updating employee Daily Time Records (DTR) by integrating with biometric devices. This solution ensures that DTRs are accurately and consistently updated on a daily basis, reducing manual effort and potential discrepancies.

### 🏗️ Architecture

The application follows a modular architecture with clear separation of concerns:

```
src/
├── core/                 # Core business logic and interfaces
│   ├── interfaces/       # Abstract interfaces
│   ├── services/         # Core business services
│   └── utils/           # Utility classes
├── features/            # Feature implementations
│   ├── database/        # Database adapters
│   └── biometric/       # Biometric device adapters
├── config/              # Configuration management
└── BiometricUpdaterApp.js # Main application orchestrator
```

### ✨ Key Features

- **Modular Design**: Easy to extend with new database types and biometric devices
- **Factory Pattern**: Automatic adapter creation based on configuration
- **Interface-Based**: Clear contracts for all adapters
- **Comprehensive Logging**: Structured logging with configurable levels
- **Error Handling**: Robust error handling and reporting
- **Multiple Sync Options**: Yesterday, specific date, or date range synchronization
- **Configuration Management**: Centralized, validated configuration




## 📦 Requirements

To ensure the proper functioning of the ZKT Biometric Updater, the following prerequisite software must be installed on your system:

- **Node.js**: Version `v16` or higher is required. You can download the latest stable version from the official Node.js website or use a version manager like `nvm` (Node Version Manager) for easier installation and management of multiple Node.js versions.

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/nicoljul1997/ZKTBiometricUpdater.git
cd ZKTBiometricUpdater
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database configuration
```

### 3. Configure Devices

**Create devices.json file (Recommended)**
```bash
# Generate a devices.json file
npm run config:generate single    # For single device
npm run config:generate multi     # For multiple devices

# Edit the generated devices.json with your device settings
```

**Alternative: Use environment variables (Legacy)**
```bash
# Edit .env file with device configuration (not recommended for multiple devices)
```

### 4. Validate Configuration

```bash
npm run config:validate devices.json
```

### 5. Run Synchronization

```bash
# Sync yesterday's data (default)
npm start

# Sync specific date
npm run sync:date 2024-01-15

# Sync date range
npm run sync:range 2024-01-01 2024-01-31

# Sync specific devices
npm run sync:devices device1,device2

# Test device connections
npm run test:devices
```

## 📁 Configuration File Format

The `devices.json` file uses JSON format and should contain a `devices` array:

```json
{
  "devices": [
    {
      "id": "main_office",
      "name": "Main Office Device",
      "ip": "192.168.1.100",
      "port": 4370,
      "model": "ZK-U160",
      "type": "zkteco",
      "parser": "v6.60",
      "protocol": "udp",
      "inport": 5200,
      "timeout": 5000,
      "enabled": true
    },
    {
      "id": "branch_office", 
      "name": "Branch Office Device",
      "ip": "192.168.1.101",
      "port": 4370,
      "enabled": false,
      "notes": "Temporarily disabled"
    }
  ]
}
```

### Configuration File Location

The application looks for device configuration in this order:
1. `CONFIG_FILE_PATH` environment variable
2. `devices.json` (root directory)

### Device Configuration Options

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `id` | Yes | - | Unique device identifier |
| `name` | No | Same as id | Human-readable device name |
| `ip` | Yes | - | Device IP address |
| `port` | No | 4370 | Device port |
| `model` | No | 'Unknown' | Device model |
| `type` | No | 'zkteco' | Device type |
| `parser` | No | 'v6.60' | Parser version |
| `protocol` | No | 'udp' | Communication protocol |
| `inport` | No | 5200 | Internal port |
| `timeout` | No | 5000 | Connection timeout (ms) |
| `enabled` | No | true | Whether device is active |
| `notes` | No | - | Optional notes |




## ⚙️ Setup Instructions

Follow these steps to set up and configure the BiometricUpdater script on your system:

### 1. Clone the Repository

Begin by cloning the project repository from GitHub to your local machine. Open your terminal or command prompt and execute the following commands:

```bash
git clone https://github.com/nicoljul1997/ZKTBiometricUpdater.git
cd ZKTBiometricUpdater
```

Once the repository is cloned, navigate into the project directory. Before running the script, ensure all necessary dependencies are installed by executing:

```bash
npm install
```

### 2. Configure Environment Variables

The script relies on environment variables for sensitive information such as database credentials and API keys. A sample environment file (`.env.sample`) is provided to guide you. Copy this file to create your own `.env` file:

```bash
cp .env.sample .env
```

Open the newly created `.env` file using a text editor and replace the placeholder values with your actual configuration details. It is crucial to provide accurate information for the script to function correctly.

### 3. Load `.env` File in the Script

For the script to correctly load the environment variables when executed by a cron job, you must explicitly tell it where to find the `.env` file. Add the following line at the very top of your main script file (e.g., `bioupdater.js`):

```javascript
require('dotenv').config({ path: '/absolute/path/to/your/.env', quiet: true });
```

> ⚠️ **Important**: Always use an **absolute path** for the `.env` file within your script. This ensures that the cron job can locate and load the environment variables correctly, regardless of the working directory from which the cron job is executed.




## 🕒 Cron Job Setup

To automate the execution of the BiometricUpdater script, you can set up a cron job. This will allow the script to run automatically at specified intervals without manual intervention. The following instructions detail how to schedule the script to run daily at 1:00 AM.

### 1. Open the Crontab Editor

To add or edit cron jobs, you need to access your user's crontab file. Open the crontab editor by executing the following command in your terminal:

```bash
crontab -e
```

This command will open the crontab file in your default text editor.

### 2. Add the Cron Job Entry

Once the crontab editor is open, add the following line to the end of the file. This line defines the schedule and the command to execute:

```bash
0 1 * * * /home/administrator/.nvm/versions/node/v20.19.3/bin/node /absolute/path/to/your/bioupdater.js >> /absolute/path/to/log/bioupdater.log 2>&1
```

**Explanation of the Cron Entry:**

- `0 1 * * *`: This part specifies the schedule for the cron job.
    - `0`: Represents the minute (at the 0th minute of the hour).
    - `1`: Represents the hour (at 1 AM).
    - `* * *`: These three asterisks represent the day of the month, month, and day of the week, respectively. An asterisk means 

that the job will run every day, every month, and every day of the week.

- `/home/administrator/.nvm/versions/node/v20.19.3/bin/node`: This is the absolute path to your Node.js executable. You should replace this with the actual path to your Node.js installation. You can find this path by running `which node` in your terminal.

- `/absolute/path/to/your/bioupdater.js`: This is the absolute path to your main script file (`bioupdater.js`). Ensure this path is correct.

- `>> /absolute/path/to/log/bioupdater.log 2>&1`: This part redirects the output of the script.
    - `>> /absolute/path/to/log/bioupdater.log`: Appends both standard output (stdout) to the specified log file.
    - `2>&1`: Redirects standard error (stderr) to the same location as standard output, ensuring all messages, including errors, are logged.

This cron job configuration will ensure that:
- The script runs daily at **1:00 AM**.
- All output and errors generated by the script are logged to the specified `bioupdater.log` file, which is crucial for monitoring and troubleshooting.




## 🧪 Testing Your Setup

Before relying on the cron job for automated execution, it is highly recommended to manually test the script to verify that everything is configured correctly and working as expected. This step helps in identifying and resolving any potential issues early on.

To manually run the script, open your terminal or command prompt and execute the following command:

```bash
node /absolute/path/to/your/bioupdater.js
```

**Verification:**

After running the script, carefully check the console output for any error messages. Additionally, inspect the log file (specified in your cron job setup, e.g., `/absolute/path/to/log/bioupdater.log`) to ensure that the script executed successfully and performed its intended operations without issues. Look for confirmation messages or data updates that indicate a successful run.




## 📊 View Logs

Monitoring the script's execution and output is crucial for verifying its operation and troubleshooting any issues. All script output, including informational messages and errors, is redirected to a log file as configured in the cron job setup.

To view the contents of the log file, use the `cat` command in your terminal:

```bash
cat /absolute/path/to/log/bioupdater.log
```

Replace `/absolute/path/to/log/bioupdater.log` with the actual path to your log file as specified in your cron job entry. Regularly reviewing this log file will help you ensure the script is running smoothly and identify any anomalies.




--- 

**Note**: Remember to replace all placeholder values (e.g., `/absolute/path/to/your/.env`, `/absolute/path/to/your/bioupdater.js`, `/absolute/path/to/log/bioupdater.log`) with your actual system paths and configurations. These values are critical for the correct operation of the script in your environment.



