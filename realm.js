import Realm from 'realm';

class Photo extends Realm.Object {}
Photo.schema = {
    name: 'Photo',
    primaryKey: 'id',
    properties: {
      id: 'string',
      name: 'string',
      path: 'string',
      date: 'date',
      location: 'string?', // optional syntax
      comment:  'string?'
    }
};

export default new Realm({schema: [Photo]});