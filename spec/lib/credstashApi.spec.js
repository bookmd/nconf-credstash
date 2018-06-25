/**
 * Created by meirshalev on 15/02/2017.
 */
var CredstashApi = require('../../lib/credstashApi');
const TABLE_NAME = 'nconf-credstash-tests';

describe('CredstashApi', function() {

  function cleanup(api) {
    var store = api.getAll();
    Object.keys(store).forEach(function(key) {
      api.delete(key);
    });
  }

  var api;

  beforeAll(function() {
    api = new CredstashApi({ table: TABLE_NAME });
    api.setup();
  });

  afterAll(function() {
    cleanup(api);
  });

  describe('put, get and delete', function() {
    it('puts a value into CredStash, gets it and deletes it', function() {
      var value = 'value';
      var key = 'key';

      api.put(key, value);
      var returned = api.get(key);
      expect(returned).toEqual(value);
      api.delete(key);

      var shouldNotBeUndefined = api.get(key);
      expect(shouldNotBeUndefined).not.toBeDefined();
    });
  });

  describe('put, get, put to another value, get and delete', function() {
      it('puts a value into CredStash, gets it, updates it, gets it and deletes it', function() {
          var value = 'initialValue';
          var value2 = 'updatedValue';
          var key = 'key';

          api.put(key, value);
          var returned = api.get(key);
          expect(returned).toEqual(value);

          api.put(key,value2);
          var returned2 = api.get(key);
          expect(returned2).toEqual(value2);

          api.delete(key);
          var shouldNotBeUndefined = api.get(key);
          expect(shouldNotBeUndefined).not.toBeDefined();
      });
  });

  describe('put, getAll and delete', function() {
    it('puts 2 values into CredStash, gets them and deletes them', function() {
      var expected = {
        key1: 'value1',
        key2: 'value2'
      };

      Object.keys(expected).forEach(function(key) {
        api.put(key, expected[key]);
      });

      var returned = api.getAll();
      expect(returned).toEqual(expected);

      Object.keys(expected).forEach(function(key) {
        api.delete(key);
      });

      var shouldBeEmpty = api.getAll();
      expect(shouldBeEmpty).toEqual({});
    });
  });

  describe('Test arguments', function() {
    var api1;
    var api2;
    const FIRST_TABLE_KEY = 'only_on_first_table';
    const SECOND_TABLE_KEY = 'only_on_second_table';

    afterAll(function() {
      cleanup(api1);
      cleanup(api2);
    });

    it('puts the values in the table specified in the constructor', function() {
      api1 = new CredstashApi({ table: 'firstTable' });
      api1.setup();
      api2 = new CredstashApi({ table: 'secondTable' });
      api2.setup();

      // put a value on the first table
      api1.put(FIRST_TABLE_KEY, FIRST_TABLE_KEY);
      var value1 = api1.get(FIRST_TABLE_KEY);
      expect(value1).toEqual(FIRST_TABLE_KEY);

      // assert that it doesn't appear on the second table
      var value2 = api2.get(FIRST_TABLE_KEY);
      expect(value2).not.toBeDefined();

      // put a value on the second table
      api2.put(SECOND_TABLE_KEY, SECOND_TABLE_KEY);
      var value3 = api2.get(SECOND_TABLE_KEY);
      expect(value3).toEqual(SECOND_TABLE_KEY);

      // assert that it doesn't appear on the first table
      var value4 = api1.get(SECOND_TABLE_KEY);
      expect(value4).not.toBeDefined();
    });

    it('puts values with encryption context and only gets them when using \'get()\' with the same context', function() {
      api1 = new CredstashApi({ table: TABLE_NAME, context: { env: 'test1' } });
      api2 = new CredstashApi({ table: TABLE_NAME, context: { env: 'test2' } });

      // put a value on the first table
      api1.put(FIRST_TABLE_KEY, FIRST_TABLE_KEY);
      var value1 = api1.get(FIRST_TABLE_KEY);
      expect(value1).toEqual(FIRST_TABLE_KEY);
      // assert that it doesn't appear on the second table
      expect(function() { api2.get(FIRST_TABLE_KEY) }).toThrow();

      // put a value on the second table
      api2.put(SECOND_TABLE_KEY, SECOND_TABLE_KEY);
      var value3 = api2.get(SECOND_TABLE_KEY);
      expect(value3).toEqual(SECOND_TABLE_KEY);
      // assert that it doesn't appear on the first table
      expect(function() { api1.get(SECOND_TABLE_KEY) }).toThrow();
    });
  });
});