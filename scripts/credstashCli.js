"use strict";

/**
 * Created by Idan on 06/14/2018
 */
const process = require('process');
const program = require('commander');
const _ = require('lodash');
const CredstashApi = require('../lib/credstashApi');

function _interactWithApi(credstashApiInstance, apiFunc, funcArgs) {
    try {
        if (funcArgs) {
            if (!Array.isArray(funcArgs)) {
                funcArgs = _.castArray(funcArgs);
            }
        } else {
            funcArgs = [];
        }
        return apiFunc.apply(credstashApiInstance, funcArgs);
    } catch (e) {
        throw new Error(`There was an error working against CredstashApi. Error: ${e}`);
    }
}

function _convertObjectJsonPropertyToObject(object, key) {
    if (typeof object[key] !== 'function' && object[key].charAt(0) === '{') {
        try {
            object[key] = JSON.parse(object[key]);
        } catch (e) {
            throw new Error(`Error parsing JSON.
            Error message: ${e.toString()}
            Key: ${key}
            Value: ${object[key]}`);
        }
    }
}

function _printToConsoleWithJsonFormatting(object) {
    try {
        console.log(JSON.stringify(object, null, 4));
    } catch (e) {
        throw new Error(`There was a problem printing the output as JSON, here is the raw output:\n
        ${object.toString()}`)
    }
}

function getValue(region = undefined, table, appKey = undefined, key = undefined) {
    this.credStashApi = new CredstashApi({table: table, region: region});
    let storedValue = null;

    if (appKey === undefined) {
        storedValue = _interactWithApi(this.credStashApi, this.credStashApi.getAll);
        Object.keys(storedValue).forEach((key) => _convertObjectJsonPropertyToObject(storedValue, key));
    } else {
        storedValue = _interactWithApi(this.credStashApi, this.credStashApi.get, appKey);
        storedValue = (storedValue !== undefined) ? JSON.parse(storedValue) : storedValue;
    }

    if (storedValue !== undefined && key !== undefined) {
        storedValue = _.get(storedValue, key, `Key ${key} does not exist`);
    }

    return storedValue;
}

function putValue(region = undefined, table, appKey, key, value) {
    if (value.charAt(0) === '{') {
        try {
            value = JSON.parse(value);
        } catch (e) {
            throw new Error(`The value you entered is not a valid JSON, check the formatting.`);
        }
    }

    this.credStashApi = new CredstashApi({table: table, region: region});
    let storedValue = _interactWithApi(this.credStashApi, this.credStashApi.get, appKey);
    storedValue = (storedValue === undefined) ? {} : JSON.parse(storedValue);

    let oldValue = _.get(storedValue, key, undefined);
    storedValue = _.set(storedValue, key, value);
    _interactWithApi(this.credStashApi, this.credStashApi.put, [appKey, JSON.stringify(storedValue)]);
    storedValue = JSON.parse(_interactWithApi(this.credStashApi, this.credStashApi.get, appKey));

    return {
        path: `${table}.${appKey}.${key}:`,
        oldValue: oldValue,
        newValue: _.get(storedValue, key)
    };
}

function deleteApp(region = undefined, table, appKey) {
    this.credStashApi = new CredstashApi({table: table, region: region});
    this.credStashApi.delete(appKey);
}

function setupTable(region = undefined, table) {
    this.credStashApi = new CredstashApi({table: table, region: region});
    this.credStashApi.setup();
}

program
    .command('setup <table>')
    .description('Creates a table in Credstash')
    .option("-r, --region <region>", "The AWS region to work against")
    .action(function(table, cmd) {
        _printToConsoleWithJsonFormatting(setupTable(cmd.region, table));
    });

program
    .command('get <table> <appKey> [key]')
    .description('Read the value of a key in CredStash')
    .option("-r, --region <region>", "The AWS region to work against")
    .action(function (table, appKey, key, cmd) {
        _printToConsoleWithJsonFormatting(getValue(cmd.region, table, appKey, key));
    });

program
    .command('getall <table>')
    .description('Read all the values of an appKey in CredStash')
    .option("-r, --region <region>", "The AWS region to work against")
    .action(function (table, cmd) {
        _printToConsoleWithJsonFormatting(getValue(cmd.region, table));
    });

program
    .command('put <table> <appKey> <key> <value>')
    .description('Puts the value of a key in CredStash')
    .option("-r, --region <region>", "The AWS region to work against")
    .action(function(table, appKey, key, value, cmd) {
        _printToConsoleWithJsonFormatting(putValue(cmd.region, table, appKey, key, value));
    });

program
    .command('delete <table> <appKey>')
    .description('Delete an app from CredStash')
    .option("-r, --region <region>", "The AWS region to work against")
    .action(function (table, appKey, cmd) {
        _printToConsoleWithJsonFormatting(deleteApp(cmd.region, table, appKey));
    });

program.parse(process.argv);

module.exports = {getValue, putValue, deleteApp, setupTable};