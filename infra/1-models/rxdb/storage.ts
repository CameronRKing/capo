import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';


const wrap = (storage: any) => {
    if (process.env.NODE_ENV === 'development') {
        // return storage;
        // turning this off for now, because we want users to be able to collaborate on incomplete documents
        return wrappedValidateAjvStorage({ storage });
    } else {
        return storage;
    }
}

export default {
    memory: wrap(getRxStorageMemory()),
    dexie: wrap(getRxStorageDexie()),
}