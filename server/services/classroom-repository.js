import { db, persistenceReady } from "./store.js";
const data = (snapshot) => (snapshot.exists ? snapshot.data() : null);
export const classroomRepository = {
  ready() {
    if (!persistenceReady)
      throw Object.assign(
        new Error("Cần cấu hình Firebase Admin để sử dụng lớp học."),
        { status: 503 },
      );
  },
  async get(path) {
    this.ready();
    return data(await db.doc(path).get());
  },
  async list(path, filter) {
    this.ready();
    let query = db.collection(path);
    if (filter) query = query.where(filter.field, "==", filter.value);
    return (await query.get()).docs.map((d) => d.data());
  },
  async transaction(fn) {
    this.ready();
    return db.runTransaction((tx) =>
      fn({
        get: async (path) => data(await tx.get(db.doc(path))),
        set: (path, value) => tx.set(db.doc(path), value),
      }),
    );
  },
};
