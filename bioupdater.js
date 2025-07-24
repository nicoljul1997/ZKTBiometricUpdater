require('dotenv').config({ quiet: true });
const ZKLib = require('zklib');
const moment = require('moment');
var Firebird = require('node-firebird');

// Configuration for the biometric device
var biometricDevice = {
  ID: process.env.BIOMETRIC_DEVICE_ID,
  IP: process.env.BIOMETRIC_DEVICE_IP,
  NAME: process.env.BIOMETRIC_DEVICE_NAME,
  MODEL: process.env.BIOMETRIC_DEVICE_MODEL,
  PORT: process.env.BIOMETRIC_DEVICE_PORT,
  PHARSER: process.env.BIOMETRIC_DEVICE_PHARSER,
  PROTOCOL: process.env.BIOMETRIC_DEVICE_PROTOCOL,
};

// Firebird database configuration
var firebirdConfig = {};

firebirdConfig.host = process.env.FIREBIRD_HOST;
firebirdConfig.port = process.env.FIREBIRD_PORT;
firebirdConfig.database = process.env.FIREBIRD_DATABASE_PATH;
firebirdConfig.user = process.env.FIREBIRD_USER;
firebirdConfig.password = process.env.FIREBIRD_PASSWORD;
firebirdConfig.encoding = process.env.FIREBIRD_ENCODING;

// Function to update the biometric device's last updated timestamp
const updateBioDevice = async () => {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    return new Promise((resolve, reject) => {
        Firebird.attach(firebirdConfig, (err, db) => {
            if (err) {
                console.error('Error attaching to DB:', err);
                return reject(err);
            }

            db.query(
                'UPDATE BIOMETRICDEVICES SET DATELASTUPDATED = ? WHERE ID = ?',
                [now, biometricDevice.ID],
                (err, result) => {
                    db.detach();

                    if (err) {
                        console.error('Error updating BIOMETRIC:', err);
                        return reject(err);
                    } else {
                        return resolve(result);
                    }
                }
            );
        });
    });
};

// Function to insert a single record into the EMPLOYEETIMERECORDS table
const insertSingleRecord = (item, bioIP, bioName) => {
    const employeeID = item.employeenumber;
    const time = item.timerecord;
    const inoutmode = item.inoutmode;

    return new Promise((resolve, reject) => {
        Firebird.attach(firebirdConfig, (err, db) => {
            if (err) return reject(err);

            db.query(
                'INSERT INTO emptimerecords (EMPNUMBER, TIMERECORD, INOUTMODE, IPADDRESS, LOCATION ) VALUES (?, ?, ?, ?, ?)',
                [employeeID, time, inoutmode, bioIP, bioName],
                (err, result) => {
                    db.detach();

                    if (err) {
                        console.error('Error inserting data:', err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    });
};

// This function will call insertSingleRecord for each item in the filtered array
const insertTimeRecord = async (filtered) => {
    const bioIP = biometricDevice.IP;
    const bioName = biometricDevice.NAME;

    console.log('Total records to insert:', filtered.length);

    for (const item of filtered) {
        await insertSingleRecord(item, bioIP, bioName);
    }

    // Function only returns after all inserts are done
    console.log('Successfully uploaded all DTR records for',moment().subtract(1, 'days').format('YYYY-MM-DD'));
    updateBioDevice();
};

// This function connects to the device, retrieves attendance data, formats it, filters it for yesterday
const getBioData = () => {
 
    const zk = new ZKLib({
      ip: biometricDevice.IP,
      port: biometricDevice.PORT,
      inport: 5200,
      timeout: 5000,
      attendanceParser: biometricDevice.PHARSER,
      connectionType: biometricDevice.PROTOCOL,
    });

    zk.connect((err) => {
        if (err) {
            console.error('Failed to connect to device:', err);
            return;
        }

        console.log('Connected to device');

        zk.getAttendance((err, data) => {
            zk.disconnect(); // Disconnect immediately after getting data

            if (err) {
            console.error('Error getting attendance:', err);
            return;
            }

            const formattedLogs = data.map((log) => ({
            employeenumber: log.uid,
            timerecord: moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
            inoutmode: log.inOutStatus,
            }));

            const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
            
            const filtered = formattedLogs.filter(record =>
            record.timerecord.startsWith(yesterday));

            // console.log('Attendance Records:', filtered);
            insertTimeRecord(filtered);
        });
    });
}

getBioData();
