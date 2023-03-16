module.exports = {
    isSuccess: (value)=>{
        if(value > 299 || value < 200){
            return false;
        }
        return true;
    }
}