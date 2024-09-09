// app.js
const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./utils/db');  // Import the connectDB function
const cors=require('cors')
const path=require('path')
const rateLimit = require('express-rate-limit');

const app = express();
// Cors
app.use(cors(
  {
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
));

// Serve static files from the 'public/static' directory
app.use('/static', express.static(path.join(__dirname, 'public/static')));
// Middleware
app.use(bodyParser.json());


// Rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (15 minutes)
  message: 'Too many requests from this IP, please try again later.',
  headers: true,
});

//Routes
const userRoutes=require('./routes/userRoute')
const gptRoutes=require('./routes/gptRoute')
const projectRoutes=require('./routes/projectRoute')
const documentRoutes=require('./routes/documentRoute')

//API starter calls
app.use('/api',userRoutes);
app.use('/api', gptRoutes);
app.use('/api', projectRoutes);
app.use('/api', documentRoutes);

app.get('/',(req,res)=>{
  console.log(req);
  return res.status(234).send("Hello World from backend");
});


// Function to start the server
const startServer = async () => {
  try {
    // Attempt to connect to MongoDB
    await connectDB();

    // Once connected, start the server
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error.message);
    process.exit(1);  // Exit process with failure code
  }
};

// Start the server
startServer();
