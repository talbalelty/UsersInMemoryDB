/**
 * Trie data structure to store user names.
 * Used to quickly search for users by name.
 */
class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(name, user) {
        let node = this.root;
        for (const char of name) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }

            node = node.children[char];
        }
        node.users.push(user);
    }

    search(prefix) {
        let node = this.root;
        for (const char of prefix) {
            if (!node.children[char]) {
                return [];
            }

            node = node.children[char];
        }

        return this.collectAllUsers(node);
    }

    collectAllUsers(node) {
        const result = [...node.users];
        for (const child in node.children) {
            result.push(...this.collectAllUsers(node.children[child]));
        }
        return result;
    }
    
    delete(user) {
        let node = this.root;
        for (const char of user.name.toLowerCase()) {
            if (!node.children[char]) {
                return;
            }

            node = node.children[char];
        }

        node.users = node.users.filter(u => u.id !== user.id);
    }
}

class TrieNode {
    constructor() {
        this.children = {};
        this.users = [];
    }
}

module.exports = { Trie };