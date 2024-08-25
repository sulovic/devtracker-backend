
const checkUserIssuePermissions =  (issueCreatorId = null, issueStatusId = null, authUser = null) => {
 
    if (issueCreatorId === authUser?.userId) {
        return true;
    } else {return false}

}

module.exports = checkUserIssuePermissions;
