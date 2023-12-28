import { openDB } from 'idb';
import isEmpty from 'lodash/isEmpty';

import { decryptData, encryptData } from '~/helpers/crypto';

const DB_NAME = 'e4all.offline';
const DB_VERSION = 2;

const commonStore = 'common';
const translationStore = 'translations';
const translatedSegmentStore = 'translated_segments';
const segmentVoteStore = 'segment_votes';

let dbInstance;

export function openE4aDatabase() {
  if (dbInstance) {
    console.info('DB Found...');
    return dbInstance;
  }
  dbInstance = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      //   deleteDB(DB_NAME);
      if (oldVersion < 1) {
        const commonTable = db.createObjectStore(commonStore, {
          keyPath: 'key',
        });
        commonTable.createIndex('synced', 'synced');

        const translationsTable = db.createObjectStore(translationStore, {
          keyPath: 'key',
        });
        translationsTable.createIndex('synced', 'synced');
        translationsTable.createIndex('chapter', 'chapter');
        translationsTable.createIndex('work', 'work');

        const translatedSegmentsTable = db.createObjectStore(
          translatedSegmentStore,
          {
            keyPath: 'key',
          }
        );
        translatedSegmentsTable.createIndex('synced', 'synced');
        translatedSegmentsTable.createIndex('chapter', 'chapter');
        translatedSegmentsTable.createIndex('work', 'work');
        translatedSegmentsTable.createIndex('segment', 'segment');

        const segmentVotesTable = db.createObjectStore(segmentVoteStore, {
          keyPath: 'key',
        });
        segmentVotesTable.createIndex('synced', 'synced');
        segmentVotesTable.createIndex('segment', 'segment');
      }
    },
  });
  return dbInstance;
}

/**
 *
 * @param {string} indexKey Name of the string
 * @param {enum(0,1)} state State of the string
 * @returns list of object
 */

export async function readCommonData(indexKey, state = 0) {
  const db = await openE4aDatabase();

  return await db.getAllFromIndex(
    commonStore,
    indexKey,
    IDBKeyRange.only(state)
  );
}

/**
 * Remove everything
 */
export async function clearDb() {
  const db = await openE4aDatabase();

  return Promise.all[(db.clear(commonStore), db.clear(translationStore))];
}
/**
 * Remove by key
 */
export async function deleteLocalData(key) {
  const db = await openE4aDatabase();
  return db.delete(commonStore, key);
}

/**
 * Count total data
 */
export async function getStorageLength() {
  const db = await openE4aDatabase();
  const common = await db.count(commonStore);
  const translations = await db.count(translationStore);
  return {
    common,
    translations,
  };
}

// ====== DATA START =====
export async function saveToLocalDb({ data, key, synced = 0 }) {
  if (!data || !key) return;

  const db = await openE4aDatabase();

  const payload = {
    key,
    data,
    synced,
  };

  const encrypted = await encryptData(JSON.stringify(data));

  payload.data = encrypted;

  return db.put(commonStore, payload);
}

/**
 * Read data from indexDB
 */
export async function getLocalData(key) {
  if (!key) return;
  const db = await openE4aDatabase();

  const query = await db.get(commonStore, key);

  if (!query?.data) return;

  const decrypt = await decryptData(query?.data);
  return JSON.parse(decrypt);
}

// ====== DATA END =====

// ====== PLAIN DATA STARt =====

export async function savePlainDataToLocalDb({ data, key, synced = 0 }) {
  if (!data || !key) return;

  const db = await openE4aDatabase();

  const payload = {
    key,
    data,
    synced,
  };

  return db.put(commonStore, payload);
}

/**
 * Read data from indexDB
 */
export async function getPlainLocalData(key) {
  if (!key) return;

  const db = await openE4aDatabase();

  return await db.get(commonStore, key);
}

// ====== PLAIN DATA END =====

// ====== TRANSLATION DATA START =====
export async function saveTranslationToLocalDb({
  data,
  key,
  work = null,
  chapter = null,
  synced = 0,
}) {
  if (!data || !key) return;

  const db = await openE4aDatabase();

  const payload = {
    key,
    data,
    synced,
  };

  if (work) {
    payload.work = work;
  }

  if (chapter) {
    payload.chapter = chapter;
  }

  const encrypted = await encryptData(JSON.stringify(data));

  payload.data = encrypted;

  return db.put(translationStore, payload);
}

/**
 * Read data from indexDB
 */
export async function getLocalTranslationData(key) {
  if (!key) return;
  const db = await openE4aDatabase();

  const query = await db.get(translationStore, key);

  if (!query?.data) return;

  const decrypt = await decryptData(query?.data);
  return JSON.parse(decrypt);
}

/**
 * Read data from indexDB
 */
export async function getLocalTranslationByWorkData(key, indexName = 'work') {
  if (!key) return;
  const db = await openE4aDatabase();

  const query = await db.getAllFromIndex(
    translationStore,
    indexName,
    IDBKeyRange.only(key)
  );

  if (!query.length) return;

  const decryptionPromises = query.map((q) => decryptData(q?.data));

  const decrypt = await Promise.allSettled(decryptionPromises);
  const data = decrypt.map((d) => {
    if (d.status === 'fulfilled') {
      return JSON.parse(d.value);
    }
    return d.reason;
  });

  return data;
}

// ====== TRANSLATION DATA END =====

// ====== SEGEMENT TRANSLATION DATA START =====
export async function saveTranslatedSegmentToLocalDb({
  data,
  key,
  work = null,
  chapter = null,
  segment = null,
  synced = 0,
  userInfo,
}) {
  if (!data || !key) return;

  const db = await openE4aDatabase();

  const payload = {
    key,
    data,
    synced,
  };

  if (work) {
    payload.work = work;
  }

  if (chapter) {
    payload.chapter = chapter;
  }

  if (segment) {
    payload.segment = segment;
  }

  if (userInfo?.id) {
    data.lockedBy = userInfo;
    data.translatedUser = userInfo?.username;
  }

  const encrypted = await encryptData(JSON.stringify(data));

  payload.data = encrypted;

  const result = await db.put(translatedSegmentStore, payload);

  if (result === `${work}_${chapter}_${segment}`) {
    const resultObj = {
      ...data,
      lockedBy: userInfo,
    };
    return resultObj;
  }

  return null;
}

/**
 * Read data from indexDB
 */
export async function getLocalTranslatedSegementData(key) {
  if (!key) return;
  const db = await openE4aDatabase();

  const query = await db.get(translatedSegmentStore, key);

  if (!query?.data) return;

  const decrypt = await decryptData(query?.data);
  return JSON.parse(decrypt);
}

/**
 * Read data from indexDB
 */
export async function getLocalTranslatedSegmentByWorkData(
  key,
  indexName = 'work'
) {
  if (typeof key !== 'number' && !key) return;

  const db = await openE4aDatabase();

  const query = await db.getAllFromIndex(
    translatedSegmentStore,
    indexName,
    IDBKeyRange.only(key)
  );

  if (!query.length) return [];

  const decryptionPromises = query.map((q) => decryptData(q?.data));

  const decrypt = await Promise.allSettled(decryptionPromises);
  const data = decrypt.map((d) => {
    if (d.status === 'fulfilled') {
      return JSON.parse(d.value);
    }
    return d.reason;
  });

  return data;
}

// ====== SEGEMENT TRANSLATION DATA END =====

/**
 * Read translated segments with latest edited content
 * @param {string} workId
 * @param {string} chapterNumber
 * @returns
 */

export async function getLocalTranslatedSegmentsData({
  workId,
  chapterNumber,
}) {
  const key = `${workId}_${chapterNumber}`;

  const translationData = await getLocalTranslationData(key);

  if (isEmpty(translationData)) return;

  const segmentsDataByChapter = await getLocalTranslatedSegmentByWorkData(
    parseInt(chapterNumber),
    'chapter'
  );

  if (isEmpty(segmentsDataByChapter)) return translationData;

  segmentsDataByChapter.forEach((element) => {
    const index = translationData.findIndex(
      (item) => item.position === element?.position
    );

    if (index > -1 && translationData[index]) {
      Object.assign(translationData[index], element);
    }
  });

  return translationData;
}

// ====== SEGEMENT VOTES DATA START =====
export async function saveSegmentVotesToLocalDb({
  data,
  key,
  segment = null,
  synced = 0,
  work = null,
  chapter = null,
  userInfo,
}) {
  if (!data || !key) return;

  const db = await openE4aDatabase();
  let voteUniqueKey;

  if (synced === 1) {
    voteUniqueKey = key;
  } else {
    voteUniqueKey = `${key}_${data?.date}`;
  }

  const payload = {
    key: voteUniqueKey,
    data,
    synced,
  };

  if (segment?.position) {
    payload.segment = segment?.position;
  }

  const encrypted = await encryptData(
    JSON.stringify({
      ...data,
      key: voteUniqueKey,
    })
  );

  payload.data = encrypted;

  const result = await db.put(segmentVoteStore, payload);

  if (result === voteUniqueKey && synced !== 1) {
    const segmentByPosition = await getLocalTranslatedSegmentByWorkData(
      segment?.position,
      'segment'
    );

    let segmentData = {};
    let syncValue = 0;
    // Check if translated segment exists in indexDB
    if (!isEmpty(segmentByPosition)) {
      segmentData = segmentByPosition[0];
      // Get all synced translated segments
      const allSyncedSegmentData = await getLocalTranslatedSegmentByWorkData(
        1,
        'synced'
      );
      // Update the sync value accordingly if data exists
      syncValue =
        allSyncedSegmentData?.map((sd) => sd?.id)?.indexOf(segmentData?.id) > -1
          ? 1
          : 0;
    } else {
      segmentData = segment;
    }

    const role = data?.role;

    switch (role) {
      case 'translator':
        if (data?.assessment === 1) {
          segmentData.progress = 2;
          segmentData.translatorCanEdit = false;
          segmentData.translatorCanVote = true;
          segmentData.reviewerCanVote = true;
          segmentData.statistics.translators = { vote: 1, user: 1 };
        } else {
          segmentData.progress = 1;
          segmentData.translatorCanEdit = true;
          segmentData.translatorCanVote = true;
          segmentData.reviewerCanVote = false;
          segmentData.statistics.translators = { vote: 0, user: 0 };
          segmentData.canRevokeOriginal = false;
        }

        await saveTranslatedSegmentToLocalDb({
          data: segmentData,
          work,
          chapter,
          segment: segment?.position,
          key,
          synced: syncValue,
          userInfo,
        });
        break;
      case 'reviewer':
        if (data?.assessment === 1) {
          segmentData.progress = 4;
          segmentData.editorCanEdit = true;
          segmentData.editorCanVote = true;
          segmentData.reviewerCanEdit = false;
          segmentData.translatorCanVote = false;
          segmentData.statistics.reviewers = { vote: 1, user: 1 };
        } else {
          segmentData.progress = 2;
          segmentData.editorCanEdit = false;
          segmentData.editorCanVote = false;
          segmentData.reviewerCanEdit = true;
          segmentData.translatorCanVote = true;
          segmentData.statistics.reviewers = { vote: 0, user: 0 };
        }

        await saveTranslatedSegmentToLocalDb({
          data: segmentData,
          work,
          chapter,
          segment: segment?.position,
          key,
          synced: syncValue,
          userInfo,
        });
        break;
      case 'editor':
        if (data?.assessment === 1) {
          segmentData.progress = 6;
          segmentData.editorCanEdit = false;
          segmentData.reviewerCanVote = false;
          segmentData.statistics.editors = { vote: 1, user: 1 };
        } else {
          segmentData.progress = 4;
          segmentData.editorCanEdit = true;
          segmentData.reviewerCanVote = true;
          segmentData.statistics.editors = { vote: 0, user: 0 };
        }

        await saveTranslatedSegmentToLocalDb({
          data: segmentData,
          work,
          chapter,
          segment: segment?.position,
          key,
          synced: syncValue,
          userInfo,
        });
        break;
    }

    const resultObj = {
      vote: data,
      segment: segmentData,
    };

    return resultObj;
  }

  return null;
}

/**
 * Read data from indexDB
 */
export async function getLocalSegmentVotesByWorkData(
  key,
  indexName = 'segment'
) {
  if (typeof key !== 'number' && !key) return;

  const db = await openE4aDatabase();

  const query = await db.getAllFromIndex(
    segmentVoteStore,
    indexName,
    IDBKeyRange.only(key)
  );

  if (!query.length) return [];

  const decryptionPromises = query.map((q) => decryptData(q?.data));

  const decrypt = await Promise.allSettled(decryptionPromises);
  const data = decrypt.map((d) => {
    if (d.status === 'fulfilled') {
      return JSON.parse(d.value);
    }
    return d.reason;
  });

  return data;
}

/**
 * Remove data from indexDB
 */
export async function removeDataFromIndexDB(key, dbName) {
  if (!key) return;

  let database = '';

  switch (dbName) {
    case 'translation':
      database = translationStore;
      break;

    case 'segments':
      database = translatedSegmentStore;
      break;

    case 'votes':
      database = segmentVoteStore;
      break;

    default:
      break;
  }

  const db = await openE4aDatabase();

  const data = await db.get(database, key);

  if (isEmpty(data)) return;

  await db.transaction(database, 'readwrite').objectStore(database).delete(key);
}
