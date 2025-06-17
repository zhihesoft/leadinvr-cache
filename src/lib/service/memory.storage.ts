export class MemoryStorage extends Map {
    delete(pattern: string): boolean {
        if (pattern.includes("*") || pattern.includes("?")) {
            const regex = new RegExp(pattern);
            const keys = Array.from(this.keys()).filter(key => regex.test(key));
            for (const key of keys) {
                super.delete(key);
            }
            return keys.length > 0;
        } else {
            return super.delete(pattern);
        }
    }
}
