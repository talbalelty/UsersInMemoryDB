const fs = require('fs');
const papa = require('papaparse');
const usersById = {};
const usersByCountry = {};
const usersByName = {};
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
        step: (row) => {
            const user = new User(row.data.Id, row.data.Name, row.data.DOB, row.data.Country, row.data.Email);
        
            populateUsersById(user);
            populateUsersByCountry(user);
            populateUsersByName(user);
            populateUsersByDob(user);
        }
    });
};

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
    if (!usersByName[nameLower]) {
        usersByName[nameLower] = [];
    }

    usersByName[nameLower].push(user);

    nameLower.split(' ').forEach(name => {
        if (!usersByName[name]) {
            usersByName[name] = [];
        }
        usersByName[name].push(user);
    });
}

/**
 * 
 * @param {User} user 
 */
const populateUsersByDob = (user) => {
    if (!usersByDob[user.dob]) {
        usersByDob[user.dob] = [];
    }

    usersByDob[user.dob].push(user);
}

const getUserById = (id) => {
    return usersById[id];
};

const getUsersByCountry = (country) => {
    return usersByCountry[country] || [];
};

/**
 * Following the instructions I gathered that the search should return a user
 * for the fullest match, then for first/last name match and finally for a partial match.
 * 
 * I thought about using a trie to store the names, but I figured that a simple map was good enough.
 * 
 * @param {string} name 
 * @returns 
 */
const getUsersByName = (name) => {
    const lowerName = name.toLowerCase();
    const result = new Map();

    // Full match
    if (usersByName[lowerName]) {
        usersByName[lowerName].forEach(user => result.set(user.id, user));
    }

    // first/last name match
    const names = lowerName.split(' ');
    names.forEach(n => {
        if (usersByName[n]) {
            usersByName[n].forEach(user => result.set(user.id, user));
        }
    });

    // Partial match (minimum 3 chars)
    if (lowerName.length >= 3) {
        for (const key in usersByName) {
            if (key.startsWith(lowerName) && !names.includes(key)) {
                usersByName[key].forEach(user => result.set(user.id, user));
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
    const birthDate = new Date();
    birthDate.setFullYear(Math.round(birthDate.getFullYear() - age));
    return usersByDob[birthDate.toLocaleDateString('en-GB')] || [];
};


const deleteUser = (id) => {
    const user = usersById[id];
    if (!user) { return; }

    delete usersById[id];

    // Remove from usersByCountry
    const countryUsers = usersByCountry[user.country];
    usersByCountry[user.country] = countryUsers.filter(u => u.id !== id);

    // Remove from usersByName
    const lowerName = user.name.toLowerCase();
    const names = lowerName.split(' ');
    names.push(lowerName);
    names.forEach(name => {
        usersByName[name] = usersByName[name].filter(u => u.id !== id);
    });

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