"use strict";

const CredstashCli = require('../../scripts/credstashCli');
const TABLE_NAME = 'nconf-credstash-tests';

describe('CredstashCli', function () {
  function cleanup() {
    let store = CredstashCli.getValue({table: TABLE_NAME});
    Object.keys(store).forEach(function (key) {
      CredstashCli.deleteApp({table: TABLE_NAME, appKey: key});
    });
  }

  beforeAll(function () {
    CredstashCli.setupTable({table: TABLE_NAME});
  });

  afterAll(function () {
    cleanup();
  });

  describe('putValue, getValue and delete', function () {
    it('puts a value into CredStash, gets it and deletes it', function () {
      let value = 'value';
      let key = 'key';

      CredstashCli.putValue({table: TABLE_NAME, appKey: key, key, value});
      let returned = CredstashCli.getValue({table: TABLE_NAME, appKey: key, key});
      expect(returned).toEqual(value);
      CredstashCli.deleteApp({table: TABLE_NAME, appKey: key});

      let shouldNotBeUndefined = CredstashCli.getValue({table: TABLE_NAME, appKey: key, key});
      expect(shouldNotBeUndefined).not.toBeDefined();
    });
  });

  describe('putValue, getValue and delete', function () {
    it('puts a value into CredStash, gets it, updates it, gets it and deletes it', function () {
      let value = 'initialValue';
      let value2 = 'updatedValue';
      let key = 'key';

      CredstashCli.putValue({table: TABLE_NAME, appKey: key, key, value});
      let returned = CredstashCli.getValue({table: TABLE_NAME, appKey: key, key});
      expect(returned).toEqual(value);

      CredstashCli.putValue({table: TABLE_NAME, appKey: key, key, value: value2});
      let returned2 = CredstashCli.getValue({table: TABLE_NAME, appKey: key, key});
      expect(returned2).toEqual(value2);

      CredstashCli.deleteApp({table: TABLE_NAME, appKey: key});
      let shouldNotBeUndefined = CredstashCli.getValue({table: TABLE_NAME, appKey: key});
      expect(shouldNotBeUndefined).not.toBeDefined();
    });
  });

  describe('put, get all and delete', function () {
    it('puts 2 values into CredStash, gets them and deletes them', function () {
      let expected = {
        key1: 'value1',
        key2: 'value2'
      };
      let key = 'key';

      Object.keys(expected).forEach(function (jsonKey) {
        CredstashCli.putValue(
          {table: TABLE_NAME, appKey: key, key: jsonKey, value: expected[jsonKey]}
        );
      });


      let returned = CredstashCli.getValue({table: TABLE_NAME, appKey: key});
      expect(returned).toEqual(expected);

      CredstashCli.deleteApp({table: TABLE_NAME, appKey: key});

      let shouldBeUndefined = CredstashCli.getValue({table: TABLE_NAME, appKey: key});
      expect(shouldBeUndefined).not.toBeDefined();
    });
  });
});