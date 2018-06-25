/**
 * Created by Idan on 06/14/2018
 */

const process = require('process');
const program = require('commander');
const _ = require('lodash');
const CredstashApi = require('../lib/credstashApi');

function convertObjectJsonPropertyToObject(object, key) {
    if (typeof object[key] !== 'function' && object[key].charAt(0) === '{') {
        try {
            object[key] = JSON.parse(object[key]);
        } catch (e) {
            console.error(`Error parsing JSON.
            Error message: ${e.toString()}
            Key: ${key}
            Value: ${object[key]}`);
            process.exit(1);
        }
    }
}

function getValue(table, appKey = undefined, key = undefined) {
    this.credStashApi = new CredstashApi({table: table});
    let storedValue = null;

    if (appKey === undefined) {
        storedValue = this.credStashApi.getAll();
        Object.keys(storedValue).forEach((key) => convertObjectJsonPropertyToObject(storedValue, key));
    } else {
        storedValue = JSON.parse(this.credStashApi.get(appKey));
    }

    if (key !== undefined) {
        storedValue = _.get(storedValue, key, `Key ${key} does not exist`);
    }

    console.log(JSON.stringify(storedValue, null, 4));
}

function updateValue(table, appKey, key, value) {
    if (value.charAt(0) === '{') {
        try {
            value = JSON.parse(value);
        } catch (e) {
            console.error(`The value you entered is not a valid JSON, check the formatting.`);
            process.exit();
        }
    }

    this.credStashApi = new CredstashApi({table: table});
    let storedValue = JSON.parse(this.credStashApi.get(appKey));

    let oldValue = _.get(storedValue, key, undefined);
    storedValue = _.set(storedValue, key, value);
    this.credStashApi.put(appKey, `'${JSON.stringify(storedValue)}'`);
    storedValue = JSON.parse(this.credStashApi.get(appKey));
    let newValue = _.get(storedValue, key);
    console.log(`${table}.${appKey}.${key}:
        Old Value: ${JSON.stringify(oldValue, null, 4)}
        New Value: ${JSON.stringify(newValue, null, 4)}`);
}

program
.command('get <table> <appKey> [key]')
    .description('Read the value of a key in CredStash')
    .action((table, appKey, key) => getValue(table, appKey, key));

program
    .command('getall <table>')
    .description('Read all the values of an appKey in CredStash')
    .action((table) => getValue(table));

program
.command('put <table> <appKey> <key> <value>')
    .description('Puts the value of a key in CredStash')
    .action((table, appKey, key, value) => updateValue(table, appKey, key, value));

program.parse(process.argv);