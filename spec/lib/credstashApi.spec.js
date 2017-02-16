/**
 * Created by meirshalev on 15/02/2017.
 */
var CredstashApi = require('../../lib/credstashApi');

describe('CredstashApi', function() {

  var api = new CredstashApi({});

  function cleanup() {
    var store = api.getAll();
    Object.keys(store).forEach(function(key) {
      api.delete(key);
    });
  }

  afterAll(function() {
    cleanup();
  });

  describe('#put, get and delete', function() {
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

  describe('#put, getAll and delete', function() {
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
});