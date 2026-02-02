import { getRepName } from '../../utils.js';

function getLastName(rep) {
    return getRepName(rep.id)
        .split(' ')
        .splice(-1)
        [0];
}

function byLastName(left, right) {
    return getLastName(left).localeCompare(getLastName(right));
}

function byGroupAndRank(left, right) {
    if (left.group && left.group.localeCompare(right.group)) {
        return left.group.localeCompare(right.group);
    }
    return byRank(left, right);
}

function byRank(left, right) {
    const lRank = Number(left.rank);
    const rRank = Number(right.rank);
    if (lRank === null && rRank === null) {
        return 0;
    } else if (lRank === null) {
        return 1;
    } else if (rRank === null) {
        return -1;
    }
    return lRank < rRank ? -1 : lRank > rRank ? 1 : 0;
}

function getUnranked(resumes) {
    return resumes.filter(r => !r.group).sort(byLastName)
}

function getGroup(resumes, group) {
    return resumes.filter(r => r.group == group).sort(byRank);
}

function sortIntoGroup(resumes, resume, group) {
    const newRank = getGroup(resumes, group).length + 1;
    resume.group = group;
    resume.rank = newRank;
}

export {
    byLastName,
    byGroupAndRank,
    byRank,
    getUnranked,
    getGroup,
    sortIntoGroup,
}