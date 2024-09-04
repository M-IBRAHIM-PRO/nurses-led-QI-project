const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

async function registerUser(req, res) {
    try {
        // In case if any of the field is missing
        if (!req.body.username || !req.body.email || !req.body.password || !req.body.apiKey) {
            return res
                .status(400)
                .json({ message: "Please provide all the required fields" });
        }
        else {
            console.log(req.body); //For checking response send in console
            const { username, email, password, apiKey } = req.body;
            bcrypt.hash(password, 10)
                .then((hash) => {
                    userModel.create({ username, email, password: hash, apiKey})
                        .then(res.status(200).json({ message: "User created successfully in backend" }))
                        .catch((err) => {
                            console.log(err);
                            return res.status(500).json({ message: err });
                        });
                });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error });
    }
}
async function loginUser(req, res) {
    console.log(req.body);
    const { email, password } = req.body;

    try {
        userModel.findOne({ email: email }).then((user) => {
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            else {
                bcrypt.compare(password, user.password, async (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: err });
                    }
                    else if (result == true) {
                        var token = GenerateToken(user);
                        // Set the token in a cookie

                        // console.log(token);
                        console.log("Logged In successfully");
                        return res.status(200).json({
                            message: "User logged in successfully",
                            email: email,
                            userid: user._id,
                            role:user.role,
                            token: token,
                        });
                    }
                    else if (result == false) {
                        return res.status(401).json({ message: "Invalid Credentials" });
                    }
                });
            }
        }).catch((err) => {
            console.log(err);
            return res.status(500).json({ message: err });
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ apierror: error });
    }
}
function GenerateToken(user) {
    const payload = {
        id: user._id,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return token;
}
// Functions related to PubMed Key
const getPubMedKey = async (req, res) => {
    try {
        console.log("Fetching PubMed key for user:", req.user.id);

        // Fetch the user based on the ID from the token
        const user = await userModel.findById(req.user.id);
        if (!user) {
            console.log("User not found in DB");
            return res.status(404).json({ message: 'User not found' });
        }

        console.log("Sending key");
        // Return the apiKey directly
        return res.status(200).json({ message: 'PubMed Key Fetched!', key: user.apiKey });

    } catch (error) {
        console.error('Error fetching PubMed key:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
};

// Update the PubMed key
const updatePubMedKey = async (req, res) => {
    const { key } = req.body;
    if (!key) {
        return res.status(400).json({ message: 'Key is required' });
    }

    try {
        const existingKey = await userModel.findById(req.user.id);
        if (!existingKey) {
            return res.status(404).json({ message: 'PubMed key not found' });
        }

        existingKey.apiKey = key;
        await existingKey.save();

        res.json({ message: 'PubMed key updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Add a new PubMed key
// const addPubMedKey = async (req, res) => {
//     const { key } = req.body;
//     console.log(req.body);
//     if (!key) {
//         return res.status(400).json({ message: 'Key is required' });
//     }

//     try {
//         const newKey = new GPTKey({
//             key,
//         });
//         await newKey.save();

//         return res.status(201).json({ message: 'PubMed key added successfully' });
//     } catch (error) {
//         return res.status(500).json({ message: 'Server error', error });
//     }
// };
// Seperate from frontend
const findUserIdByEmail = async (email) => {
    try {
        const user = await userModel.findOne({ email });
        if (user) {
            console.log(`User found with email ${email}: ${user._id}`);
            return user._id; // Return the user ID
        } else {
            console.log(`No user found with email ${email}`);
            return null; // Return null if no user is found
        }
    } catch (error) {
        console.error('Error finding user by email:', error);
        throw error; // Handle the error as needed
    }
};


module.exports = {
    registerUser,
    loginUser,
    findUserIdByEmail,

    // addPubMedKey,
    getPubMedKey,
    updatePubMedKey
}