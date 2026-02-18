const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Defensive Polyfills for PouchDB / Hermes
// Must be set BEFORE any PouchDB adapter touches react-native
if (typeof global !== 'undefined') {
  global.AsyncStorage = AsyncStorage;
}

const RN = require('react-native');
try {
  Object.defineProperty(RN, 'AsyncStorage', {
    get: () => AsyncStorage,
    configurable: true,
    enumerable: true
  });
} catch (e) { }

const PouchDB = require('pouchdb-core');
const HttpAdapter = require('pouchdb-adapter-http');
const Replication = require('pouchdb-replication');
const Find = require('pouchdb-find');
const AsyncStorageAdapterPlugin = require('pouchdb-adapter-asyncstorage');

// Unwrap ESM default export if needed
const AsyncStorageAdapter = AsyncStorageAdapterPlugin.default || AsyncStorageAdapterPlugin;

// Register Standard Plugins
PouchDB.plugin(HttpAdapter);
PouchDB.plugin(Replication);
PouchDB.plugin(Find);

// Register the AsyncStorage adapter manually.
// The built-in valid() check fails on modern React Native (AsyncStorage removed from core).
// We register the adapter directly on PouchDB's internal adapter map.
if (typeof AsyncStorageAdapter === 'function') {
  // The plugin is an install function — call it, but first monkey-patch PouchDB.adapter
  const origAdapter = PouchDB.adapter;
  PouchDB.adapter = function (name, impl, preferred) {
    if (impl && impl.valid && name === 'asyncstorage') {
      impl.valid = () => true;
    }
    return origAdapter.call(this, name, impl, preferred);
  };
  AsyncStorageAdapter(PouchDB);
  PouchDB.adapter = origAdapter; // restore
} else {
  // It's a plugin object — register via plugin but patch valid() first
  PouchDB.plugin(AsyncStorageAdapter);
}

// Fallback: if the adapter still didn't register, force it into the adapters map
if (!PouchDB.adapters || !PouchDB.adapters.asyncstorage) {
  // Get the raw adapter constructor from the module's source
  const rawModule = require('pouchdb-adapter-asyncstorage');
  // Try calling the plugin installer with a patched PouchDB
  const fakePouchDB = {
    adapter: function (name, obj, preferred) {
      if (!PouchDB.adapters) PouchDB.adapters = {};
      obj.valid = () => true;
      PouchDB.adapters[name] = obj;
      if (preferred) {
        PouchDB.preferredAdapters = PouchDB.preferredAdapters || [];
        PouchDB.preferredAdapters.push(name);
      }
    }
  };
  const installer = rawModule.default || rawModule;
  if (typeof installer === 'function') {
    installer(fakePouchDB);
  }
}

// Create databases using the asyncstorage adapter
const dbOptions = {
  adapter: 'asyncstorage',
  auto_compaction: true
};

export const patientDB = new PouchDB('medfield_patients', dbOptions);
export const householdDB = new PouchDB('medfield_households', dbOptions);
export const visitDB = new PouchDB('medfield_visits', dbOptions);
export const taskDB = new PouchDB('medfield_tasks', dbOptions);
export const referralDB = new PouchDB('medfield_referrals', dbOptions);
export const syncDB = new PouchDB('medfield_sync', dbOptions);

// Patient operations
export const patientService = {
  async create(patient) {
    const doc = {
      ...patient,
      _id: patient.patient_id || `patient_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false
    };
    return await patientDB.put(doc);
  },

  async getAll() {
    return await patientDB.allDocs({ include_docs: true });
  },

  async getById(id) {
    try {
      return await patientDB.get(id);
    } catch (e) {
      return null;
    }
  },

  async update(patient) {
    const existing = await patientDB.get(patient._id || patient.patient_id);
    const doc = {
      ...existing,
      ...patient,
      updated_at: new Date().toISOString(),
      synced: false
    };
    return await patientDB.put(doc);
  },

  async search(query) {
    return await patientDB.find({
      selector: {
        $or: [
          { first_name: { $regex: query } },
          { last_name: { $regex: query } },
          { patient_id: { $regex: query } }
        ]
      }
    });
  },

  async getUnsynced() {
    return await patientDB.find({
      selector: { synced: false }
    });
  }
};

// Household operations
export const householdService = {
  async create(household) {
    const doc = {
      ...household,
      _id: household.household_number || `hh_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false
    };
    return await householdDB.put(doc);
  },

  async getAll() {
    return await householdDB.allDocs({ include_docs: true });
  },

  async getById(id) {
    try {
      return await householdDB.get(id);
    } catch (e) {
      return null;
    }
  },

  async update(household) {
    const existing = await householdDB.get(household._id || household.household_number);
    const doc = {
      ...existing,
      ...household,
      updated_at: new Date().toISOString(),
      synced: false
    };
    return await householdDB.put(doc);
  },

  async getUnsynced() {
    return await householdDB.find({
      selector: { synced: false }
    });
  }
};

// Visit operations
export const visitService = {
  async create(visit) {
    const doc = {
      ...visit,
      _id: visit.visit_number || `visit_${Date.now()}`,
      visit_date: visit.visit_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false
    };
    return await visitDB.put(doc);
  },

  async getAll() {
    return await visitDB.allDocs({ include_docs: true });
  },

  async getByPatient(patientId) {
    return await visitDB.find({
      selector: { patient_id: patientId }
    });
  },

  async getUnsynced() {
    return await visitDB.find({
      selector: { synced: false }
    });
  }
};

// Task operations
export const taskService = {
  async create(task) {
    const doc = {
      ...task,
      _id: task.id || `task_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false
    };
    return await taskDB.put(doc);
  },

  async getAll() {
    return await taskDB.allDocs({ include_docs: true });
  },

  async getPending() {
    return await taskDB.find({
      selector: { status: 'pending' }
    });
  },

  async getToday() {
    const today = new Date().toISOString().split('T')[0];
    return await taskDB.find({
      selector: {
        due_date: { $gte: today }
      }
    });
  },

  async update(task) {
    const existing = await taskDB.get(task._id || task.id);
    const doc = {
      ...existing,
      ...task,
      updated_at: new Date().toISOString(),
      synced: false
    };
    return await taskDB.put(doc);
  },

  async getUnsynced() {
    return await taskDB.find({
      selector: { synced: false }
    });
  }
};

// Referral operations
export const referralService = {
  async create(referral) {
    const doc = {
      ...referral,
      _id: referral.referral_number || `ref_${Date.now()}`,
      referral_date: referral.referral_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false
    };
    return await referralDB.put(doc);
  },

  async getAll() {
    return await referralDB.allDocs({ include_docs: true });
  },

  async getPending() {
    return await referralDB.find({
      selector: { status: 'pending' }
    });
  },

  async getUnsynced() {
    return await referralDB.find({
      selector: { synced: false }
    });
  }
};

// Sync operations
export const syncService = {
  async getLastSync() {
    try {
      const doc = await syncDB.get('last_sync');
      return doc;
    } catch (e) {
      return null;
    }
  },

  async setLastSync(timestamp, stats) {
    const doc = {
      _id: 'last_sync',
      timestamp,
      stats,
      updated_at: new Date().toISOString()
    };
    try {
      const existing = await syncDB.get('last_sync');
      doc._rev = existing._rev;
    } catch (e) { }
    return await syncDB.put(doc);
  },

  async getSyncQueue() {
    const patients = await patientService.getUnsynced();
    const visits = await visitService.getUnsynced();
    const tasks = await taskService.getUnsynced();
    const referrals = await referralService.getUnsynced();
    const households = await householdService.getUnsynced();

    return {
      patients: patients.docs,
      visits: visits.docs,
      tasks: tasks.docs,
      referrals: referrals.docs,
      households: households.docs
    };
  }
};

export default {
  patientService,
  householdService,
  visitService,
  taskService,
  referralService,
  syncService
};
