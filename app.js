const express  = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt  = require('bcrypt');
const User    = require('./models/User');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session configuration
app.use(
  session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

// Connect to MongoDB
mongoose
  .connect('mongodb://127.0.0.1:27017/cafeBookingDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

// State and district data
const cafes = {
  Karnataka: {
    Bangalore: [
      'Cafe Coffee Day, Brigade Road, Bangalore',
      'Starbucks, Indiranagar, Bangalore',
      'The Humming Tree, Indiranagar, Bangalore',
    ],
    Mysore: [
      'Cafe Corner, Mysore Palace Road, Mysore',
      'The Coffee Shop, Krishnaraja Boulevard, Mysore',
      'RRR Cafe, Sayyaji Rao Road, Mysore',
    ],
  },
};

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login');
});

// Handle Login
app.post('/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.send('All fields are required!');
  }

  try {
    // Find user
    const user = await User.findOne({ name });
    if (!user) {
      return res.send('Invalid user. Please register first.');
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send('Incorrect password!');
    }

    // Set session and redirect to state-district page
    req.session.user = user;
    res.redirect('/state-district');
  } catch (err) {
    console.error(err);
    res.send('Error logging in. Try again.');
  }
});

// Registration Page
app.get('/register', (req, res) => {
  res.render('register');
});

// Handle Registration
app.post('/register', async (req, res) => {
  const { name, dob, category, password } = req.body;

  if (!name || !dob || !category || !password) {
    return res.send('All fields are required!');
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user
    const user = new User({ name, dob, category, password: hashedPassword });
    await user.save();

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send('Error registering user. Try again.');
  }
});

// Dashboard Page
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('dashboard', { user: req.session.user });
});

// State and District Selection Page
app.get('/state-district', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('state-district'); // Render state-district selection
});

// Handle State and District Selection
app.post('/cafes', (req, res) => {
  const { state, district } = req.body;

  if (!state || !district) {
    return res.send('Please select both state and district.');
  }

  const selectedCafes = cafes[state][district] || [];
  res.render('cafes', { state, district, cafes: selectedCafes });
});
app.post('/mood-selector', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    res.render('mood-selector');
});    
app.post('/food-options', (req, res) => {
        const { mode } = req.body;
      
        if (!mode) {
          return res.send('Please select a mode.');
        }
      
        let foodOptions = [];
      
        switch (mode) {
          case 'Birthday Party':
            foodOptions = ['Cakes', 'Snacks', 'Beverages'];
            break;
          case 'Business Meeting':
            foodOptions = ['Sandwiches', 'Coffee', 'Pastries'];
            break;
          case 'Casual Hangout':
            foodOptions = ['Burgers', 'Fries', 'Soft Drinks'];
            break;
          case 'Romantic Date':
            foodOptions = ['Pasta', 'Wine', 'Desserts'];
            break;
          case 'Family Gathering':
            foodOptions = ['Pizzas', 'Salads', 'Juices'];
            break;
          default:
            foodOptions = [];
        }
      
        res.render('food-options', { mode, foodOptions });
  });
  // Route to show all food options
app.post('/show-all-foods', (req, res) => {
  const allFoods = [
    'Cakes', 'Snacks', 'Beverages', 
    'Sandwiches', 'Coffee', 'Pastries', 
    'Burgers', 'Fries', 'Soft Drinks', 
    'Pasta', 'Wine', 'Desserts', 
    'Pizzas', 'Salads', 'Juices'
  ];
  res.render('food-options', { mode: 'All Foods', foodOptions: allFoods });
});

  app.get('/table-selection', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
  
    // Sample table options based on the mood
    const tables = [
      { id: 1, name: 'Table 1 (Window Seat)' },
      { id: 2, name: 'Table 2 (Near the Bar)' },
      { id: 3, name: 'Table 3 (Corner Seat)' },
      { id: 4, name: 'Table 4 (Outdoor Seating)' },
    ];
  
    res.render('table-selection', { tables });
  });

  app.post('/confirm-table', (req, res) => {
    const { table } = req.body;
  
    if (!table) {
      return res.send('Please select a table.');
    }
  
    // Table selection confirmation message
    const tableNames = {
      1: 'Table 1 (Window Seat)',
      2: 'Table 2 (Near the Bar)',
      3: 'Table 3 (Corner Seat)',
      4: 'Table 4 (Outdoor Seating)',
    };
  
    const selectedTable = tableNames[table];

    res.redirect('/payment');
    
  });
  // Route to show the payment page
app.get('/payment', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    
    // Sample data for the calculation (replace with actual user selections)
    const foodItems = req.session.foodOptions || []; // Get food items from session or other sources
    const tableCharge = 100; // Example table charge
    const gstRate = 0.18; // 18% GST
  
    // Sample food prices (replace with actual logic to get selected food prices)
    const foodPrices = {
      'Cakes': 300,
      'Snacks': 150,
      'Beverages': 100,
      'Sandwiches': 250,
      'Coffee': 80,
      'Pastries': 120,
      'Burgers': 200,
      'Fries': 80,
      'Soft Drinks': 50,
      'Pasta': 350,
      'Wine': 500,
      'Desserts': 200,
      'Pizzas': 400,
      'Salads': 150,
      'Juices': 100,
    };
  
    let totalFoodPrice = foodItems.reduce((total, item) => total + foodPrices[item], 0);
    let gstAmount = totalFoodPrice * gstRate;
    let totalBill = totalFoodPrice + tableCharge + gstAmount;
  
    // Pass this information to the payment page
    res.render('payment', { totalBill, foodItems, tableCharge, gstAmount });
  });
  // Route to handle payment confirmation
app.post('/confirm-payment', (req, res) => {
    const { paymentType } = req.body;
    const user = req.session.user; // Get the current user from the session
    
    // Handle Single Payment
    if (paymentType === 'single') {
      // Example of confirmation message
      console.log(`Order Confirmed, Thank you ${user.name}!`);
      return res.redirect('/feedback');
    }
  
    // Handle Group Split Payment
    if (paymentType === 'group') {
      // Logic to handle splitting payment among group members
      // For simplicity, let's assume a group size of 4
      const groupSize = 4;
      const amountPerPerson = req.session.totalBill / groupSize;
      
      res.render('group-payment', { amountPerPerson, groupSize });
    }
  });
  // Route to show the feedback page after payment
app.get('/feedback', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
  
    res.render('feedback', { userName: req.session.user.name });
  });
  // Route to handle feedback after payment confirmation
app.post('/submit-feedback', (req, res) => {
    const feedback = req.body.feedback;
    const user = req.session.user;
    
    // Store feedback in the database (MongoDB)
    const feedbackData = {
      userId: user._id,
      feedback: feedback,
      date: new Date(),
    };
  
    
  
      
      // Display confirmation message
    console.log(`Thank you for your feedback, ${user.name}!`);
    res.render('thank-you');

 });

  // Route for the homepage
app.get('/home', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
  
    res.render('home', { userName: req.session.user.name });
  });
  // Route for user exit (logout)
app.get('/exit', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.send('Error logging out.');
      }
      res.redirect('/login');
    });
  });


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});