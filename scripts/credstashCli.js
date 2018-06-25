/**
 * Created by Idan on 6/14/18
 */

const process = require('process');
const program = require('commander');
const _ = require('lodash');
const CredstashApi = require('../lib/credstashApi');

function getValue(table, appKey = undefined, key = undefined) {
    this.credStashApi = new CredstashApi({table: table});
    let storedValue = null;

    if (appKey === undefined) {
        storedValue = this.credStashApi.getAll();
        Object.keys(storedValue).forEach(
            function (keyName) {
                if (typeof storedValue[keyName] !== 'function' && storedValue[keyName].charAt(0) === '{') {
                    try {
                        storedValue[keyName] = JSON.parse(storedValue[keyName]);
                    } catch (e) {
                        console.error("Error parsing JSON from CredStash. Error message: " + e.toString());
                        console.error("Offending key: " + keyName);
                        console.error("Value: " + storedValue[keyName]);
                        process.exit(1);
                    }
                }
            });
    } else {
        storedValue = JSON.parse(this.credStashApi.get(appKey));
    }

    if (key !== undefined) {
        storedValue = _.get(storedValue, key, "Key " + key + " does not exist");
    }

    console.log(JSON.stringify(storedValue, null, 4));
}

function updateValue(table, appKey, key, value) {
    if (value.charAt(0) === '{') {
        try {
            value = JSON.parse(value);
        } catch (e) {
            console.error("The value you entered is not a valid JSON.");
            process.exit();
        }
    }

    this.credStashApi = new CredstashApi({table: table});
    let storedValue = JSON.parse(this.credStashApi.get(appKey));

    let oldValue = _.get(storedValue, key, undefined);
    storedValue = _.set(storedValue, key, value);
    this.credStashApi.put(appKey, "'" + JSON.stringify(storedValue) + "'");
    storedValue = JSON.parse(this.credStashApi.get(appKey));
    let newValue = _.get(storedValue, key);
    console.log(table + "." + appKey + "." + key + ":\n" +
                "Old Value: " + JSON.stringify(oldValue, null, 4) + "\n" +
                "New Value: " + JSON.stringify(newValue, null, 4));
}

program
.command('get <table> <appKey> [key]')
    .description('Read the value of a key in CredStash')
    .option('-r, --region <regionName>', 'Region name')
    .action((table, appKey, key) => getValue(table, appKey, key));

program
    .command('getall <table>')
    .description('Read all the values of an appKey in CredStash')
    .option('-r, --region <regionName>', 'Region name')
    .action((table) => getValue(table));

program
.command('put <table> <appKey> <key> <value>')
    .description('Puts the value of a key in CredStash')
    .option('-r, --region <regionName>', 'Region name')
    .action((table, appKey, key, value) => updateValue(table, appKey, key, value));

program.parse(process.argv);