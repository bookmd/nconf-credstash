"use strict";

/**
 * Created by Idan on 06/14/2018
 */
const process = require('process');
const program = require('commander');
const _ = require('lodash');
const CredstashApi = require('../lib/credstashApi');

function _checkIfProfileSpecified(cmd) {
    if (cmd.profile === undefined) {
        throw new Error('-p <profile> is required!');
    }
}

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

function getValue(cmd, table, appKey = undefined, key = undefined) {
    const { region, profile } = cmd;
    const credStashApi = new CredstashApi({table: table, profile: profile, region: region});
    let storedValue = null;

    if (appKey === undefined) {
        storedValue = _interactWithApi(credStashApi, credStashApi.getAll);
        Object.keys(storedValue).forEach((key) => _convertObjectJsonPropertyToObject(storedValue, key));
    } else {
        storedValue = _interactWithApi(credStashApi, credStashApi.get, appKey);
        storedValue = (storedValue !== undefined) ? JSON.parse(storedValue) : storedValue;
    }

    if (storedValue !== undefined && key !== undefined) {
        storedValue = _.get(storedValue, key, `Key ${key} does not exist`);
    }

    return storedValue;
}

function putValue(cmd, table, appKey, key, value) {
    if (value.charAt(0) === '{') {
        try {
            value = JSON.parse(value);
        } catch (e) {
            throw new Error(`The value you entered is not a valid JSON, check the formatting.`);
        }
    }

    const { region, profile } = cmd;
    const credStashApi = new CredstashApi({table: table, profile: profile, region: region});
    let storedValue = _interactWithApi(credStashApi, credStashApi.get, appKey);
    storedValue = (storedValue === undefined) ? {} : JSON.parse(storedValue);

    const oldValue = _.get(storedValue, key, undefined);
    storedValue = _.set(storedValue, key, value);
    _interactWithApi(credStashApi, credStashApi.put, [appKey, JSON.stringify(storedValue)]);
    storedValue = JSON.parse(_interactWithApi(credStashApi, credStashApi.get, appKey));

    return {
        path: `${table}.${appKey}.${key}:`,
        oldValue: oldValue,
        newValue: _.get(storedValue, key)
    };
}

function deleteApp(cmd, table, appKey) {
    const { region, profile } = cmd;
    const credStashApi = new CredstashApi({table: table, profile: profile, region: region});
    credStashApi.delete(appKey);
}

function setupTable(cmd, table) {
    const { region, profile } = cmd;
    const credStashApi = new CredstashApi({table: table, profile: profile, region: region});
    credStashApi.setup();
}

program
    .command('setup <table>')
    .description('Creates a table in Credstash')
    .option("-r, --region <region>", "The AWS region to work against")
    .option("-p, --profile <profile>", "The AWS profile to use")
    .action(function(table, cmd) {
        _checkIfProfileSpecified(cmd);
        _printToConsoleWithJsonFormatting(setupTable(cmd, table));
    });

program
    .command('get <table> <appKey> [key]')
    .description('Read the value of a key in CredStash')
    .option("-r, --region <region>", "The AWS region to work against")
    .option("-p, --profile <profile>", "The AWS profile to use")
    .action(function (table, appKey, key, cmd) {
        _checkIfProfileSpecified(cmd);
        _printToConsoleWithJsonFormatting(getValue(cmd, table, appKey, key));
    });

program
    .command('getall <table>')
    .description('Read all the values of an appKey in CredStash')
    .option("-r, --region <region>", "The AWS region to work against")
    .option("-p, --profile <profile>", "The AWS profile to use")
    .action(function (table, cmd) {
        _checkIfProfileSpecified(cmd);
        _printToConsoleWithJsonFormatting(getValue(cmd, table));
    });

program
    .command('put <table> <appKey> <key> <value>')
    .description('Puts the value of a key in CredStash')
    .option("-r, --region <region>", "The AWS region to work against")
    .option("-p, --profile <profile>", "The AWS profile to use")
    .action(function(table, appKey, key, value, cmd) {
        _checkIfProfileSpecified(cmd);
        _printToConsoleWithJsonFormatting(putValue(cmd, table, appKey, key, value));
    });

program
    .command('delete <table> <appKey>')
    .description('Delete an app from CredStash')
    .option("-r, --region <region>", "The AWS region to work against")
    .option("-p, --profile <profile>", "The AWS profile to use")
    .action(function (table, appKey, cmd) {
        _checkIfProfileSpecified(cmd);
        _printToConsoleWithJsonFormatting(deleteApp(cmd, table, appKey));
    });

program.parse(process.argv);

module.exports = {getValue, putValue, deleteApp, setupTable};