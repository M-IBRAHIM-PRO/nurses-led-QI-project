const projectModel = require('../models/projectModel');
const userModel = require('../models/userModel');
const {transporter}=require('../utils/mailTranspoter')


// async function fetchAllProjectsByRole(req, res) {
//     const userId = req.user.id; // Assuming user ID is available in request

//     try {
//         console.log("Fetching projects for user:", userId);
//         // Fetch projects where user is the owner
//         const ownedProjects = await projectModel.find({ owner: userId }).populate('owner', 'username email');

//         // Fetch collaboration requests where user is a requester
//         const collaborationRequests = await CollaborationRequest.find({ requester: userId });

//         // Fetch projects where user is a collaborator
//         const collaboratorProjects = await projectModel.find({ _id: { $in: collaborationRequests.map(req => req.projectId) } })
//             .populate('owner', 'username email')
//             .populate({
//                 path: 'collaborators',
//                 select: 'username email',
//                 populate: {
//                     path: '_id',
//                     select: 'username email'
//                 }
//             });

//         // Add collaboration status to each collaborator
//         collaboratorProjects.forEach(project => {
//             project.collaborators = project.collaborators.map(collaborator => {
//                 const request = collaborationRequests.find(req => req.projectId.equals(project._id));
//                 return {
//                     ...collaborator.toObject(),
//                     status: request ? request.status : 'unknown'
//                 };
//             });
//         });

//         // Fetch all projects
//         const allProjects = await projectModel.find().populate('owner', 'username email');

//         // Filter out projects where user is neither an owner nor a collaborator
//         const notInvolvedProjects = allProjects.filter(project =>
//             project.owner.toString() !== userId.toString() &&
//             !collaboratorProjects.some(proj => proj._id.toString() === project._id.toString())
//         );
//         console.log('User ID:', userId);
//         console.log('Owned Projects:', ownedProjects);
//         console.log('Collaboration Requests:', collaborationRequests);
//         console.log('Collaborator Projects:', collaboratorProjects);
//         console.log('All Projects:', allProjects);
//         res.json({
//             ownedProjects,
//             collaboratorProjects,
//             notInvolvedProjects
//         });
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ message: error });
//     }
// }

async function fetchAllProjectsByRole(req, res) {
    const userId = req.user.id; // Assuming user ID is available in request

    try {
        console.log("Fetching projects for user:", userId);

        const collaboratorProjects = await projectModel.find({ collaborators: userId })
            .populate('owner', 'username email')
            .populate({
                path: 'collaborators',
                select: 'username email'  // Ensure you select 'username' and 'email'
            })
            .populate({
                path: 'documents',
                select: 'link createdBy',
                populate: {
                    path: 'createdBy',
                    select: 'username email'
                }
            });

        // Fetch projects where the user is the owner
        const ownedProjects = await projectModel.find({ owner: userId })
            .populate('owner', 'username email')
            .populate({
                path: 'collaborators',
                select: 'username email'  // Ensure you select 'username' and 'email'
            })
            .populate({
                path: 'documents',
                select: 'link createdBy createdAt',
                populate: {
                    path: 'createdBy',
                    select: 'username email'
                }
            });

        // Combine owned and collaborator projects
        const involvedProjects = ownedProjects.concat(collaboratorProjects);

        // Fetch all projects
        const allProjects = await projectModel.find().populate('owner', 'username email');

        // Filter out projects where user is neither an owner nor a collaborator
        const notInvolvedProjects = allProjects.filter(project =>
            !involvedProjects.some(involvedProject => involvedProject._id.toString() === project._id.toString())
        );

        console.log('User ID:', userId);
        console.log('Involved Projects:', involvedProjects);
        console.log('Not Involved Projects:', notInvolvedProjects);

        res.json({
            involvedProjects,
            notInvolvedProjects
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

const projectDetails = async (req, res) => {
    try {
        console.log(req.params.id);
        const project = await projectModel.findById(req.params.id)
            .populate('owner', 'username email')
            .populate({
                path: 'collaborators',
                select: 'username email'  // Ensure you select 'username' and 'email'
            })
            .populate({
                path: 'documents',
                select: 'link createdBy',
                populate: {
                    path: 'createdBy',
                    select: 'username email'
                }
            });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }

}

const createProject = async (req, res) => {
    try {
        const { title, description, searchQuery } = req.body;
        console.log(req.user.id);
        console.log(req.body);
        const newProject = new projectModel({
            title,
            description,
            searchQuery,
            owner: req.user.id,
            lastModifiedBy: req.user.id,
            lastModifiedAt: new Date()
        });

        await newProject.save();

        return res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ message: 'Error creating project', error });
    }
};

// Collaborators
const addCollaborator = async (req, res) => {
    const { projectId, email } = req.body;

    if (!projectId || !email) {
        return res.status(400).json({ message: 'Project ID and email are required.' });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const project = await projectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        if (project.collaborators.includes(user._id)) {
            return res.status(400).json({ message: 'User is already a collaborator.' });
        }

        project.collaborators.push(user._id);
        await project.save();

        res.status(200).json({ message: 'Collaborator added successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
}

const collaborationRequest = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const userId = req.user.id; // Assuming req.user is set by your authentication middleware
        console.log(req.params);
        // Check if project exists
        const project = await projectModel.findById(projectId).populate('owner');
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if the user is already a collaborator
        if (project.collaborators.includes(userId)) {
            return res.status(400).json({ error: 'You are already a collaborator' });
        }

        // Add the user to the project collaborators
        project.collaborators.push(userId);
        await project.save();

        // Get project owner's email
        const ownerEmail = project.owner.email;
        if (!ownerEmail) {
            return res.status(500).json({ error: 'Project owner email not found' });
        }

        // Get the requesting user's email
        const requestingUser = await userModel.findById(userId);
        const requestingUserEmail = requestingUser.email;
        if (!requestingUserEmail) {
            return res.status(500).json({ error: 'Your email address not found' });
        }

        // Send email notification to the project owner
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address (your server's email)
            to: ownerEmail, // Recipient address (project owner's email)
            subject: 'Collaboration Request', // Subject line
            text: `Hello,

A new collaboration request has been made for your project titled "${project.title}" by ${requestingUserEmail}.

You can review and respond to this request as needed.

Best regards,
Your Team`, // Plain text body
            // html: `<p>Hello,</p><p>A new collaboration request has been made for your project titled "<strong>${project.title}</strong>" by ${requestingUserEmail}.</p><p>You can review and respond to this request as needed.</p><p>Best regards,<br>Your Team</p>` // HTML body (optional)
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Collaboration request sent successfully' });
    } catch (error) {
        console.error('Error requesting collaboration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    fetchAllProjectsByRole,
    createProject,
    addCollaborator,
    projectDetails, 
    collaborationRequest
};

// How to construct
// const query = encodeURIComponent('"Artificial Intelligence" OR AI OR "machine learning" OR "deep learning" AND "Nursing Practice" OR nursing OR "nurse care" AND "Healthcare Systems" OR healthcare OR "health systems" OR "medical systems" AND "benefits" OR advantages OR improvements');
// const dateRange = 'last5years';
// const publicationTypes = 'review,clinical-trial';

// const url = `https://pubmed.ncbi.nlm.nih.gov/?term=${query}&filter=${dateRange}&filter=${publicationTypes}`;

// console.log(url);