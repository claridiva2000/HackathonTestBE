const express = require("express");
const connectDB = require("./config/db");

const app = express();

//connect DB
connectDB();

//init Middleware
app.use(express.json({extended:false}))



app.get("/", (req, res) => res.json({ msg: `welcome to contact-keeper API` }));

//routes
app.use("/api/users", require("./routes/users"));
app.use("/api/contacts", require("./routes/contacts"));
app.use("/api/auth", require("./routes/auth"));

//port
const PORT = process.env.PORT || 5000;

//port listening
app.listen(PORT, () => console.log(`server started on ${PORT}`));
