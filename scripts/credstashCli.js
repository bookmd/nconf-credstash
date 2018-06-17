// get input from argv
// check and process flags (including errors etc.)
    // exist
    // only start with letters 

// current:
// -t "tableName"
// r "regionName"

// cli:
// --region "regionName" (ex. "us-east" ?)
// --table "tableName" (ex. "credstash-test-table")
// --app "appName" (ex. "postgres")
// --key "keyName" (ex. "username")
// --value "value" (ex. "blabla")

/**
 * Created by Idan on 6/14/18
 */

const program = require('commander');
const CredstashApi = require('../lib/credstashApi');

function runCredstashCli(region, table, app, key, value) {
    console.log(program.region);
    console.log(region);
}

function readByKey(region, table, app, key) {
    this.credStashApi = new CredstashApi({table: table,
        region: region,
        context: options.context});
    this.credStashApi._getByKey(key);
}

function updateValue(region, table, app, key, value) {
    this.credStashApi = new CredstashApi({table: table,
        region: region,
        context: options.context});
    let keyValue = this.credStashApi.get(key);
    keyValue = value;

}

// process.argv[2] = "update";
// process.argv[3] = "region";
// process.argv[4] = "test";
// process.argv[5] = "test";
// process.argv[6] = "test";
// process.argv[7] = "test";

program
.command('read <region> <table> [app] [key]')
    .description('Read the value of a key in CredStash')
    .action((region, table, app, key) => readByKey(region, table, app, key));

program
.command('update <region> <table> <app> <key> <value>')
    .description('Update the value of a key in CredStash')
    .action((region, table, app, key, value) => updateValue(region, table, app, key, value));

program.parse(process.argv);