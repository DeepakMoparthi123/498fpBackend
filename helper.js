
function checkForNull(query){
    try {
        var output = JSON.parse(query);
        return output;
    }
    catch {
        return null;
    }
}
// Necessary to parse JSON
function getNumber(query){
        try {
           if (query == null){
               return 0;
           }
           var output = parseInt(query);
           
           if (output < 0){
               return 0;
           }
           return output;
        }
        catch {
            return 0;
        }
    }

module.exports = {
	checkForNull: checkForNull,
	getNumber: getNumber
}