/**
 * Created by meirshalev on 14/02/2017.
 */

var Credstash = require('../../index');

var storeHolder = {};

describe('test private methods of nconf-credstash', function() {

  beforeEach(function() {
    storeHolder.store = {
      '1': {
        '1.1': {
          '1.1.2': 'i am 1.1.2'
        }
      }
    }
  });

  describe('_insertIntoStore', function() {
    it('should add a new key with the specified value', function() {
      const value = 'i am 1.1.1';
      var expected = {
        '1': {
          '1.1': {
            '1.1.1': value,
            '1.1.2': 'i am 1.1.2'
          }
        }
      };
      const path = ['1', '1.1', '1.1.1'];

      Credstash.prototype._insertIntoStore.call(storeHolder, path, value);
      expect(storeHolder.store).toEqual(expected);
    });

    it('should update an existing value', function() {
      const value = 'i am also 1.1.2';
      var expected = {
        '1': {
          '1.1': {
            '1.1.2': value
          }
        }
      };
      const path = ['1', '1.1', '1.1.2'];
      Credstash.prototype._insertIntoStore.call(storeHolder, path, value);
      expect(storeHolder.store).toEqual(expected);
    });
  });

  describe('_hasPath', function() {
    it('should return true since the path exist in the store', function() {
      const path = ['1', '1.1', '1.1.2'];
      var answer = Credstash.prototype._hasPath.call(storeHolder, path);
      expect(answer).toBe(true);
    });

    it('should return false since the path doesn\'t exist in the store', function() {
      const path = ['1', '1.1', '1.1.1'];
      var answer = Credstash.prototype._hasPath.call(storeHolder, path);
      expect(answer).not.toBe(true);
    });
  });

  describe('_fetchFromStore', function() {
    it('should return the correct value', function() {
      const path = ['1', '1.1', '1.1.2'];
      var value = Credstash.prototype._fetchFromStore.call(storeHolder, path);
      expect(value).toEqual('i am 1.1.2');
    });

    it('should return undefined since the path doesn\'t exist in the store', function() {
      const path = ['1', '1.1', '1.1.1'];
      var value = Credstash.prototype._fetchFromStore.call(storeHolder, path);
      expect(value).not.toBeDefined();
    });
  });

  describe('_buildCredstashKey', function() {
    it('should transform \'mongo:credstash_password\' to \'mongo.password\'', function() {
      var key = Credstash.prototype._buildCredstashKey.call({ prefix: 'credstash_', separator: '.' }, ['mongo', 'credstash_password']);
      expect(key).toEqual('mongo.password');
    });

    it('should not change flat keys', function() {
      var key = Credstash.prototype._buildCredstashKey.call({ prefix: 'credstash_', separator: '.' }, ['credstash_password']);
      expect(key).toEqual('credstash_password');
    });
  });
});