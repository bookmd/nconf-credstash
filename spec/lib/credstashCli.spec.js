/**
 * Created by idanziv on 06/26/2018.
 */
const CredstashCli = require('../../scripts/credstashCli');
const TABLE_NAME = 'nconf-credstash-tests';

describe('CredstashCli', function() {
    function cleanup() {
        let store = CredstashCli.getValue(undefined, TABLE_NAME);
        Object.keys(store).forEach(function(key) {
            CredstashCli.deleteApp(undefined, TABLE_NAME, key);
        });
    }

    beforeAll(function() {
        CredstashCli.setupTable(undefined, TABLE_NAME);
    });

    afterAll(function() {
        cleanup();
    });

    describe('putValue, getValue and delete', function() {
        it('puts a value into CredStash, gets it and deletes it', function() {
            let value = 'value';
            let key = 'key';

            CredstashCli.putValue(undefined, TABLE_NAME, key, key, value);
            let returned = CredstashCli.getValue(undefined, TABLE_NAME, key, key);
            expect(returned).toEqual(value);
            CredstashCli.deleteApp(undefined, TABLE_NAME, key);

            let shouldNotBeUndefined = CredstashCli.getValue(undefined, TABLE_NAME, key, key);
            expect(shouldNotBeUndefined).not.toBeDefined();
        });
    });

    describe('putValue, getValue and delete', function() {
        it('puts a value into CredStash, gets it, updates it, gets it and deletes it', function() {
            let value = 'initialValue';
            let value2 = 'updatedValue';
            let key = 'key';

            let l = CredstashCli.putValue(undefined, TABLE_NAME, key, key, value);
            let returned = CredstashCli.getValue(undefined, TABLE_NAME, key, key);
            expect(returned).toEqual(value);

            l = CredstashCli.putValue(undefined, TABLE_NAME, key, key, value2);
            let returned2 = CredstashCli.getValue(undefined, TABLE_NAME, key, key);
            expect(returned2).toEqual(value2);

            CredstashCli.deleteApp(undefined, TABLE_NAME, key);
            let shouldNotBeUndefined = CredstashCli.getValue(undefined, TABLE_NAME, key);
            expect(shouldNotBeUndefined).not.toBeDefined();
        });
    });

    describe('put, get all and delete', function() {
        it('puts 2 values into CredStash, gets them and deletes them', function() {
            let expected = {
                key1: 'value1',
                key2: 'value2'
            };
            let key = 'key';

            Object.keys(expected).forEach(function(jsonKey) {
                CredstashCli.putValue(undefined, TABLE_NAME, key, jsonKey, expected[jsonKey]);
            });


            let returned = CredstashCli.getValue(undefined, TABLE_NAME, key);
            expect(returned).toEqual(expected);

            CredstashCli.deleteApp(undefined, TABLE_NAME, key);

            let shouldBeUndefined  = CredstashCli.getValue(undefined, TABLE_NAME, key);
            expect(shouldBeUndefined).not.toBeDefined();
        });
    });
});