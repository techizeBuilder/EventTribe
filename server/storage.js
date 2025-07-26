export class MemStorage {
  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async getAllUsers() {
    return Array.from(this.users.values());
  }

  async createUser(userData) {
    const id = this.currentId++;
    const user = { 
      id, 
      ...userData,
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
