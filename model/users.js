const fs = require('fs');
const papa = require('papaparse');
const { Trie } = require('./trie.js');
const usersById = {};
const usersByCountry = {};
const usersByName = new Trie();
const usersByDob = {};

class User {
    /**
     * 
     * @param {string} id 
     * @param {string} name 
     * @param {string} dob 
     * @param {string} country 
     * @param {string} email 
     */
    constructor(id, name, dob, country, email) {
        this.id = id;
        this.name = name;
        this.dob = dob;
        this.country = country;
        this.email = email;
    }
}

/**
 * I choose to have references to the users in different maps to make the search faster.
 */
const loadData = () => {
    console.log('Loading data from csv...');
    papa.parse(fs.createReadStream('data.csv'), {
        dynamicTyping: true,
        header: true,
        step: handlePapaRow,
    });
};

const handlePapaRow = (row) => {
    const user = new User(row.data.Id, row.data.Name, row.data.DOB, row.data.Country, row.data.Email);

    populateUsersById(user);
    populateUsersByCountry(user);
    populateUsersByName(user);
    populateUsersByDob(user);
}

/**
 * 
 * @param {User} user 
 */
const populateUsersById = (user) => {
    usersById[user.id] = user;
}

/**
 * 
 * @param {User} user 
 */
const populateUsersByCountry = (user) => {
    if (!usersByCountry[user.country]) {
        usersByCountry[user.country] = [];
    }
    usersByCountry[user.country].push(user);
}

/**
 * 
 * @param {User} user 
 */
const populateUsersByName = (user) => {
    const nameLower = user.name.toLowerCase();
    usersByName.insert(nameLower, user);

    for (const name of nameLower.split(' ')) {
        usersByName.insert(name, user);
    }
}

/**
 * We store users by year-month and without day to reduce granularity and make the search faster.
 * 
 * @param {User} user 
 */
const populateUsersByDob = (user) => {
    const dob = new Date(user.dob);
    const yearMonth = `${dob.getFullYear()}-${dob.getMonth()}`;

    if (!usersByDob[yearMonth]) {
        usersByDob[yearMonth] = [];
    }

    usersByDob[yearMonth].push(user);
}

/**
 * 
 * @param {string} id 
 * @returns 
 */
const getUserById = (id) => {
    return usersById[id];
};

/**
 * 
 * @param {string} country 
 * @returns 
 */
const getUsersByCountry = (country) => {
    return usersByCountry[country] || [];
};

/**
 * Following the instructions I gathered that the search should return a user
 * for the fullest match, then for first/last name match and finally for a partial match,
 * and return all the accumulated results. If this is not the case then we can return the first match.
 * 
 * @param {string} name 
 * @returns 
 */
const getUsersByName = (name) => {
    const lowerName = name.toLowerCase();
    const result = new Map(); // Using a map to avoid duplicates

    // Full match
    for (const user of usersByName.search(lowerName)) {
        result.set(user.id, user);
    }

    // First/last name match
    const names = lowerName.split(' ');
    for (const name of names) {
        for (const user of usersByName.search(name)) {
            result.set(user.id, user);
        }
    }

    // Partial match (minimum 3 chars)
    if (lowerName.length >= 3) {
        for (const key in usersByName.root.children) {
            if (!key.startsWith(lowerName) || names.includes(key)) {
                continue;
            }

            for (const user of usersByName.search(key)) {
                result.set(user.id, user);
            }
        }
    }

    return Array.from(result.values());
};

/**
 * 
 * @param {number} age 
 * @returns 
 */
const getUsersByAge = (age) => {
    const currentDate = new Date();
    const birthYear = currentDate.getFullYear() - parseInt(age);
    const birthMonth = currentDate.getMonth();

    const yearMonth = `${birthYear}-${birthMonth}`;
    return usersByDob[yearMonth] || [];
};


const deleteUser = (id) => {
    const user = usersById[id];
    if (!user) { return; }

    delete usersById[id];

    // Remove from usersByCountry
    const countryUsers = usersByCountry[user.country];
    usersByCountry[user.country] = countryUsers.filter(u => u.id !== id);

    // Remove from usersByName
    usersByName.delete(user);

    // Remove from usersByAge
    usersByDob[user.dob] = usersByDob[user.dob].filter(u => u.id !== id);
};

loadData();

module.exports = {
    User,
    getUserById,
    getUsersByCountry,
    getUsersByName,
    getUsersByAge,
    deleteUser
};