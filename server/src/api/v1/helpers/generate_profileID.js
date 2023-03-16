function createProfileID() {
    const today = new Date();
    const id = String(today.getFullYear())
        + String(today.getMonth())
        + String(today.getDate())
        + String(today.getHours())
        + String(today.getMinutes())
        + String(today.getSeconds())
        + String(today.getMilliseconds());
    return id;
}

module.exports = createProfileID;