const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function(req, res, next) {
  //get token from header
  const token = req.header("x-auth-token");

  //check if not token
  if (!token) {
    return res.status(401).json({ msg: "no token, authorization denied" });
  }
//else if it is a token
  try {
    //then we decode it
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    //and replace req.user witht he decoded password
    req.user = decoded.user;
    //and move on to the next function
    next();
  } catch (err) {
    res.status(401).json({ msg: "token is not valid" });
  }
};
