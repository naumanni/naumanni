const DB_NAME = 'naummanni_database'
const LATEST_VERSION = 2


class NaummanniDatabase {
  constructor() {
    this.db = null
  }

  open(metadata) {
    return new Promise((resolve, reject) => {
      const openRequest = window.indexedDB.open(DB_NAME, LATEST_VERSION)
      openRequest.onerror = (e) => {
        console.error('failed to open indexedDB:' + e)
        reject(e)
      }
      openRequest.onsuccess = (e) => {
        this.db = e.target.result
        resolve(this.db)
      }
      openRequest.onupgradeneeded = (e) => {
        const {oldVersion, newVersion} = e
        this.db = e.target.result
        metadata.migrate(this.db, e.target.transaction, oldVersion, newVersion)
      }
    })
  }

  bind(metadata) {
    metadata.models.forEach((model) => {
      const storeName = model.storeName
      require('assert')(storeName)

      model.query = new DatabaseQuery(this, model)
    })
  }

  //
  save(obj) {
    const storeName = getStoreNameFromObject(obj)
    const json = obj.toJS()
    require('assert')(storeName)

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')

      transaction.oncomplete = (e) => {
        resolve(e)
      }
      transaction.onerror = (e) => {
        reject(e)
      }

      const objectStore = transaction.objectStore(storeName)
      const addRequest = objectStore.add(json)

      addRequest.onsuccess = (e) => {

      }
      addRequest.onerror = (e) => {

      }
    })
  }
}


export class Metadata {
  constructor() {
    this.models = []
  }

  register(model) {
    this.models.push(model)
  }

  migrate(db, transaction, oldVersion, newVersion) {
    // とりあえず今のところTable増やすだけので雑
    if(/* oldVersion === 0*/1) {  // eslint-disable-line no-constant-condition
      // create all
      for(const model of this.models) {
        const {storeName, keyPath, indexes} = model
        let objectStore = null

        if(db.objectStoreNames.contains(storeName)) {
          objectStore = transaction.objectStore(storeName)
        } else {
          // create store
          objectStore = db.createObjectStore(storeName, {keyPath})
          console.log(`create model ${storeName}`)
        }

        // create indexes
        for(let [name, keys, options] of indexes) {
          if(!objectStore.indexNames.contains(name)) {
            objectStore.createIndex(name, keys, options)
            console.log(`create index ${storeName}/${name}`)
          }
        }
      }
    }
  }
}


class DatabaseQuery {
  constructor(database, modelClass) {
    this.database = database
    this.modelClass = modelClass
  }

  getByIndex(index, key) {
    const storeName = this.modelClass.storeName
    return new Promise((resolve, reject) => {
      const transaction = this.database.db.transaction([storeName], 'readonly')

      transaction.oncomplete = (e) => {
        resolve(e)
      }
      transaction.onerror = (e) => {
        reject(e)
      }

      const request = transaction.objectStore(storeName).index(index).get(key)

      request.onsuccess = (e) => {
        if(!e.target.result) {
          reject(new Error('object not found'))
        } else {
          resolve(new this.modelClass(e.target.result))  // eslint-disable-line new-cap
        }
      }
      request.onerror = (e) => {
        reject(e)
      }
    })
  }

  getAll(index, key) {
    const storeName = this.modelClass.storeName
    return new Promise((resolve, reject) => {
      const transaction = this.database.db.transaction([storeName], 'readonly')

      transaction.oncomplete = (e) => {
        resolve(e)
      }
      transaction.onerror = (e) => {
        reject(e)
      }

      const request = transaction.objectStore(storeName).openCursor()
      // const request = transaction.objectStore(storeName).getAll()
      const result = []

      request.onsuccess = (e) => {
        // openCursor() version
        const cursor = e.target.result

        if(cursor) {
          result.push(new this.modelClass(cursor.value))  // eslint-disable-line new-cap
          cursor.continue()
        } else {
          resolve(result)
        }

        // getAll() version (Safari 9.1.2 (11601.7.7)だと動かない)
        // if(!e.target.result) {
        //   reject(new Error('object not found'))
        // } else {
        //   resolve(e.target.result.map((data) => new this.modelClass(data)))  // eslint-disable-line new-cap
        // }
      }
      request.onerror = (e) => {
        reject(e)
      }
    })
  }
}


// TEMPORARY
function getStoreNameFromObject(obj) {
  return obj.constructor.storeName
}


// singleton
export default new NaummanniDatabase()
