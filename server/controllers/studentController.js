const Student = require('../models/Student');

exports.createStudents = async (req, res) => {
  try {
    const { students } = req.body;

    console.log('Received student data:', students); // Debug log

    // Validate request
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide valid student data' 
      });
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'parentPhone', 'address', 'batchId', 'teacherId', 'role', 'subject'];
    const missingFields = students.some(student => 
      requiredFields.some(field => !student[field])
    );

    if (missingFields) {
      return res.status(400).json({
        success: false,
        message: `All fields are required: ${requiredFields.join(', ')}`
      });
    }

    // Check for duplicate emails
    const emails = students.map(student => student.email);
    const existingStudents = await Student.find({ email: { $in: emails } });
    
    if (existingStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more email addresses are already registered'
      });
    }

    // Create students with explicit field mapping
    const studentsToCreate = students.map(student => ({
      name: student.name,
      email: student.email,
      phone: student.phone,
      parentPhone: student.parentPhone,
      address: student.address,
      batchId: student.batchId,
      teacherId: student.teacherId,
      role: student.role,
      subject: student.subject
    }));

    console.log('Creating students with data:', studentsToCreate); // Debug log

    const createdStudents = await Student.insertMany(studentsToCreate);

    console.log('Created students:', createdStudents); // Debug log

    res.status(201).json({
      success: true,
      data: createdStudents,
      message: 'Students created successfully'
    });
  } catch (error) {
    console.error('Error creating students:', error); // Debug log
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating students'
    });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const { teacherId } = req.query;
    
    const existingStudent = await Student.findOne({ 
      email,
      ...(teacherId && { teacherId }) // Include teacherId in query if provided
    });
    
    res.json({
      success: true,
      exists: !!existingStudent,
      message: existingStudent ? 'Email already exists' : 'Email is available'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking email'
    });
  }
};

exports.getStudentsByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const students = await Student.find({
      'teachersInfo.batchId': batchId
    });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
};
